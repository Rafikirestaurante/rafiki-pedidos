import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "../styles/gastosDiarios.css";
import { useAvisosRafiki, useConfirmacion } from "../../../shared/components/common";
import { supabaseConfigMensaje, supabaseConfigOk } from "../../../supabaseClient";
import {
  CATEGORIAS_GASTOS,
  METODOS_PAGO_GASTOS,
  actualizarGastoDiario,
  cargarGastosDiarios,
  cargarGastosDiariosRango,
  crearGastoDiario,
  eliminarGastoDiario,
  obtenerFechaGastoHoy
} from "../../../services/gastosDiariosService";
import { cargarCatalogoGastos } from "../../../services/catalogoGastosService";
import {
  cargarInventarioInsumos,
  registrarEntradaInventarioDesdeGasto
} from "../../../services/inventarioService";
import { describirErrorSupabase, registrarErrorSupabase } from "../../../shared/utils/supabaseErrors";
import RafikiActionMenu from "../../../shared/components/RafikiActionMenu";
import RafikiBadge from "../../../shared/components/RafikiBadge";
import RafikiEmptyState from "../../../shared/components/RafikiEmptyState";
import RafikiModal from "../../../shared/components/RafikiModal";
import { formatearFechaTermica, imprimirReporteTermico } from "../../impresion/thermalReportService";
import ThermalPrintControls from "../../impresion/ThermalPrintControls";

const FORMULARIO_INICIAL = {
  numeroFactura: "",
  fecha: obtenerFechaGastoHoy(),
  proveedor: "",
  articulos: "",
  valor: "",
  categoria: "",
  metodoPago: "",
  observacion: ""
};

function dinero(valor) {
  return Number(valor || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 });
}

function capitalizar(texto) {
  const limpio = String(texto || "").trim();
  if (!limpio) return "Sin definir";
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}

function resumirPorCampo(gastos, campo) {
  return gastos.reduce((acc, gasto) => {
    const clave = gasto[campo] || "Sin definir";
    acc[clave] = (acc[clave] || 0) + Number(gasto.valor || 0);
    return acc;
  }, {});
}

function tipoMetodoPago(metodo) {
  const limpio = String(metodo || "").toLowerCase();
  if (limpio.includes("efectivo")) return "success";
  if (limpio.includes("transferencia") || limpio.includes("nequi") || limpio.includes("banco")) return "info";
  return "neutral";
}

function crearFilasResumenObjeto(objeto = {}) {
  return Object.entries(objeto)
    .sort(([a], [b]) => String(a).localeCompare(String(b), "es", { sensitivity: "base" }))
    .map(([clave, total]) => ({
      etiqueta: capitalizar(clave),
      valor: `$${dinero(total)}`,
    }));
}

function inicioMes(fechaIso) {
  const fecha = String(fechaIso || obtenerFechaGastoHoy());
  return `${fecha.slice(0, 7)}-01`;
}

function normalizarTexto(texto) {
  return String(texto || "").trim().toLocaleLowerCase("es-CO");
}

function fechaLegible(fechaIso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(fechaIso || ""))) return "—";
  return new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${fechaIso}T12:00:00Z`));
}

function textoCsv(valor) {
  const texto = String(valor ?? "");
  return /[;"\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

function descargarCsv(nombre, filas) {
  const contenido = `\ufeff${filas.map((fila) => fila.map(textoCsv).join(";")).join("\n")}`;
  const url = URL.createObjectURL(new Blob([contenido], { type: "text/csv;charset=utf-8" }));
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

export default function GastosDiarios({ esAdministrador = false, modoRapido = false, mostrarInforme = true }) {
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [fechaInforme, setFechaInforme] = useState(obtenerFechaGastoHoy());
  const [gastos, setGastos] = useState([]);
  const [gastosPeriodo, setGastosPeriodo] = useState([]);
  const [fechaInicio, setFechaInicio] = useState(inicioMes(obtenerFechaGastoHoy()));
  const [fechaFin, setFechaFin] = useState(obtenerFechaGastoHoy());
  const [filtroProveedor, setFiltroProveedor] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroPago, setFiltroPago] = useState("");
  const [filtroDetalle, setFiltroDetalle] = useState("");
  const [cargando, setCargando] = useState(false);
  const [cargandoPeriodo, setCargandoPeriodo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [categoriasCatalogo, setCategoriasCatalogo] = useState(CATEGORIAS_GASTOS);
  const [proveedoresRapidos, setProveedoresRapidos] = useState([]);
  const [insumosInventario, setInsumosInventario] = useState([]);
  const [actualizarInventario, setActualizarInventario] = useState(false);
  const [lineasInventario, setLineasInventario] = useState([{ insumoId: "", cantidad: "" }]);
  const [modalFormularioAbierto, setModalFormularioAbierto] = useState(false);
  const [mostrarResumenDetallado, setMostrarResumenDetallado] = useState(false);
  const formularioGastoRef = useRef(null);
  const [mostrarAvisoRafiki, avisosRafiki] = useAvisosRafiki();
  const [confirmarRafiki, modalConfirmacionRafiki] = useConfirmacion();

  const totalGastos = useMemo(() => gastos.reduce((total, gasto) => total + Number(gasto.valor || 0), 0), [gastos]);
  const resumenCategorias = useMemo(() => resumirPorCampo(gastos, "categoria"), [gastos]);
  const resumenPagos = useMemo(() => resumirPorCampo(gastos, "metodoPago"), [gastos]);
  const proveedoresPeriodo = useMemo(() => [...new Set(gastosPeriodo.map((gasto) => gasto.proveedor).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" })), [gastosPeriodo]);
  const categoriasPeriodo = useMemo(() => [...new Set(gastosPeriodo.map((gasto) => gasto.categoria).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" })), [gastosPeriodo]);
  const pagosPeriodo = useMemo(() => [...new Set(gastosPeriodo.map((gasto) => gasto.metodoPago).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" })), [gastosPeriodo]);
  const gastosFiltrados = useMemo(() => gastosPeriodo.filter((gasto) => {
    if (filtroProveedor && gasto.proveedor !== filtroProveedor) return false;
    if (filtroCategoria && gasto.categoria !== filtroCategoria) return false;
    if (filtroPago && gasto.metodoPago !== filtroPago) return false;
    const busqueda = normalizarTexto(filtroDetalle);
    if (busqueda && !normalizarTexto(`${gasto.articulos} ${gasto.numeroFactura} ${gasto.observacion}`).includes(busqueda)) return false;
    return true;
  }), [gastosPeriodo, filtroProveedor, filtroCategoria, filtroPago, filtroDetalle]);
  const analisisPeriodo = useMemo(() => {
    const porProveedor = resumirPorCampo(gastosFiltrados, "proveedor");
    const porDia = resumirPorCampo(gastosFiltrados, "fecha");
    const total = gastosFiltrados.reduce((suma, gasto) => suma + Number(gasto.valor || 0), 0);
    const diasConGastos = Object.keys(porDia).length;
    const proveedorMayor = Object.entries(porProveedor).sort((a, b) => b[1] - a[1])[0] || ["—", 0];
    const diaMayor = Object.entries(porDia).sort((a, b) => b[1] - a[1])[0] || ["—", 0];
    return { total, diasConGastos, promedioDiario: diasConGastos ? total / diasConGastos : 0, proveedorMayor, diaMayor, porProveedor, porDia };
  }, [gastosFiltrados]);

  const mostrarMensaje = useCallback((texto, tipoForzado) => {
    const mensajeLimpio = String(texto || "").trim();
    if (!mensajeLimpio) return;
    const tipo = tipoForzado || (/no se pudo|revisa|activa inventario|respaldo/i.test(mensajeLimpio) ? "warning" : "success");
    mostrarAvisoRafiki({
      tipo,
      titulo: tipo === "success" ? "Gastos actualizados" : "Revisa el registro de gastos",
      mensaje: mensajeLimpio
    });
  }, [mostrarAvisoRafiki]);

  useEffect(() => {
    let activo = true;
    async function cargarCatalogosGasto() {
      if (!supabaseConfigOk) {
        setProveedoresRapidos([]);
        return;
      }
      const resultado = await cargarCatalogoGastos();
      if (!activo) return;
      setCategoriasCatalogo((resultado.categorias || []).filter((item) => item.activo !== false).map((item) => item.nombre));
      setProveedoresRapidos((resultado.proveedores || []).filter((item) => item.activo !== false));
    }
    cargarCatalogosGasto();
    return () => { activo = false; };
  }, []);

  useEffect(() => {
    let activo = true;
    async function cargarInventarioBase() {
      if (!supabaseConfigOk) return;
      try {
        const data = await cargarInventarioInsumos();
        if (activo) setInsumosInventario(data || []);
      } catch (err) {
        if (activo) {
          registrarErrorSupabase("cargar inventario desde gastos", err);
          setError(describirErrorSupabase(err, "cargar el listado de inventario"));
        }
      }
    }
    cargarInventarioBase();
    return () => { activo = false; };
  }, []);

  const cargar = useCallback(async (fecha = fechaInforme) => {
    if (!supabaseConfigOk || !esAdministrador) return;
    setCargando(true);
    setError("");
    try {
      const data = await cargarGastosDiarios(fecha);
      setGastos(data);
    } catch (err) {
      registrarErrorSupabase("cargar gastos diarios", err);
      setError(describirErrorSupabase(err, "cargar los gastos diarios"));
    } finally {
      setCargando(false);
    }
  }, [esAdministrador, fechaInforme]);

  useEffect(() => {
    cargar(fechaInforme);
  }, [cargar, fechaInforme]);

  const cargarPeriodo = useCallback(async () => {
    if (!supabaseConfigOk || !esAdministrador) return;
    if (!fechaInicio || !fechaFin || fechaInicio > fechaFin) {
      setError("La fecha inicial del análisis no puede ser posterior a la fecha final.");
      return;
    }
    setCargandoPeriodo(true);
    setError("");
    try {
      setGastosPeriodo(await cargarGastosDiariosRango(fechaInicio, fechaFin));
    } catch (err) {
      registrarErrorSupabase("cargar análisis de gastos", err);
      setError(describirErrorSupabase(err, "cargar el análisis de gastos"));
    } finally {
      setCargandoPeriodo(false);
    }
  }, [esAdministrador, fechaInicio, fechaFin]);

  useEffect(() => { cargarPeriodo(); }, [cargarPeriodo]);

  function imprimirGastosTermico(formato = "80") {
    const lista = Array.isArray(gastos) ? gastos : [];
    const ok = imprimirReporteTermico({
      formato,
      titulo: "Gastos del día",
      subtitulo: "Rafiki Gerencia · Gastos",
      meta: [
        { etiqueta: "Fecha impresión", valor: formatearFechaTermica(new Date()) },
        { etiqueta: "Fecha informe", valor: fechaInforme || "Sin fecha" },
        { etiqueta: "Gastos registrados", valor: lista.length },
        { etiqueta: "Total gastos", valor: `$${dinero(totalGastos)}` },
      ],
      secciones: [
        {
          titulo: "Resumen",
          filas: [
            { etiqueta: "Gastos registrados", valor: lista.length, fuerte: true },
            { etiqueta: "Total del día", valor: `$${dinero(totalGastos)}`, fuerte: true },
          ],
        },
        {
          titulo: "Por categoría",
          filas: crearFilasResumenObjeto(resumenCategorias),
        },
        {
          titulo: "Por método de pago",
          filas: crearFilasResumenObjeto(resumenPagos),
        },
      ],
      listado: {
        titulo: "Detalle de gastos",
        modo: "tabla",
        vacio: "Sin gastos registrados para esta fecha.",
        items: lista,
        campos: [
          { etiqueta: "Proveedor", ancho: "28%", fuerte: true, valor: (gasto) => gasto.proveedor || "Sin proveedor" },
          { etiqueta: "Categoría", ancho: "24%", valor: (gasto) => capitalizar(gasto.categoria) },
          { etiqueta: "Pago", ancho: "22%", valor: (gasto) => capitalizar(gasto.metodoPago) },
          { etiqueta: "Valor", ancho: "26%", alinear: "right", fuerte: true, valor: (gasto) => `$${dinero(gasto.valor)}` },
        ],
      },
      pie: "Gastos · tabla compacta 58 mm / 80 mm",
    });

    if (!ok) setError("No se pudo abrir la ventana de impresión. Revisa si el navegador bloqueó ventanas emergentes.");
  }

  function cambiarCampo(campo, valor) {
    setFormulario((prev) => ({ ...prev, [campo]: valor }));
  }

  function limpiarFormulario() {
    setFormulario({ ...FORMULARIO_INICIAL, fecha: obtenerFechaGastoHoy() });
    setEditandoId(null);
    setActualizarInventario(false);
    setLineasInventario([{ insumoId: "", cantidad: "" }]);
  }

  function abrirFormularioNuevo(fecha = obtenerFechaGastoHoy()) {
    limpiarFormulario();
    setFormulario({ ...FORMULARIO_INICIAL, fecha });
    setError("");
    mostrarMensaje("");
    setModalFormularioAbierto(true);
  }

  function exportarAnalisis() {
    const filas = [["Fecha", "Proveedor", "Artículos", "Categoría", "Método de pago", "Factura", "Valor", "Observación"]];
    gastosFiltrados.forEach((gasto) => filas.push([gasto.fecha, gasto.proveedor, gasto.articulos, gasto.categoria, gasto.metodoPago, gasto.numeroFactura, gasto.valor, gasto.observacion]));
    filas.push([], ["TOTAL FILTRADO", "", "", "", "", "", analisisPeriodo.total, ""]);
    descargarCsv(`gastos-${fechaInicio}-a-${fechaFin}.csv`, filas);
  }

  function cerrarFormulario() {
    setModalFormularioAbierto(false);
    limpiarFormulario();
  }

  function cambiarLineaInventario(indice, campo, valor) {
    setLineasInventario((prev) => prev.map((linea, idx) => idx === indice ? { ...linea, [campo]: valor } : linea));
  }

  function agregarLineaInventario() {
    setLineasInventario((prev) => [...prev, { insumoId: "", cantidad: "" }]);
  }

  function quitarLineaInventario(indice) {
    setLineasInventario((prev) => prev.length <= 1 ? [{ insumoId: "", cantidad: "" }] : prev.filter((_, idx) => idx !== indice));
  }

  function obtenerNombreInsumo(insumoId) {
    return insumosInventario.find((item) => item.id === insumoId)?.nombre || "Insumo";
  }

  function aplicarGastoRecurrente(trabajador) {
    const fecha = formulario.fecha || obtenerFechaGastoHoy();
    setEditandoId(null);
    setFormulario((prev) => ({
      ...prev,
      numeroFactura: "",
      fecha,
      proveedor: trabajador.nombre,
      articulos: trabajador.descripcionSugerida || `Pago día ${trabajador.nombre}`,
      valor: "",
      categoria: trabajador.categoria || "Trabajadores",
      metodoPago: prev.metodoPago || "Efectivo",
      observacion: "Gasto recurrente rápido"
    }));
    mostrarMensaje(`${trabajador.nombre} cargado.`);
    setError("");
    if (!modoRapido) setModalFormularioAbierto(true);
  }

  async function guardarGasto(event) {
    event.preventDefault();
    setGuardando(true);
    setError("");
    mostrarMensaje("");

    try {
      let gastoGuardado = null;
      if (editandoId) {
        gastoGuardado = await actualizarGastoDiario(editandoId, formulario);
        mostrarMensaje("Gasto actualizado correctamente.");
      } else {
        gastoGuardado = await crearGastoDiario(formulario);
        if (actualizarInventario) {
          const lineasValidas = lineasInventario
            .map((linea) => ({ ...linea, cantidadNumero: Number(linea.cantidad || 0) }))
            .filter((linea) => linea.insumoId && Number.isFinite(linea.cantidadNumero) && linea.cantidadNumero > 0);

          if (!lineasValidas.length) throw new Error("Activa inventario solo si seleccionas al menos un insumo y una cantidad mayor a cero.");

          await Promise.all(lineasValidas.map((linea) => registrarEntradaInventarioDesdeGasto({
            gastoId: gastoGuardado?.id,
            insumoId: linea.insumoId,
            cantidad: linea.cantidadNumero,
            fecha: formulario.fecha || obtenerFechaGastoHoy(),
            usuario: "Gastos Rafiki",
            motivo: `Compra ${formulario.proveedor || "proveedor"}${formulario.numeroFactura ? ` · Factura ${formulario.numeroFactura}` : ""} · ${obtenerNombreInsumo(linea.insumoId)}`
          })));
        }
        const mensajeExito = actualizarInventario ? "Gasto guardado e inventario actualizado." : "Gasto guardado correctamente.";
        mostrarMensaje(mensajeExito);
      }
      const fechaGuardada = formulario.fecha || obtenerFechaGastoHoy();
      limpiarFormulario();
      if (!modoRapido) setModalFormularioAbierto(false);
      if (esAdministrador) {
        setFechaInforme(fechaGuardada);
        await cargar(fechaGuardada);
        await cargarPeriodo();
      }
    } catch (err) {
      if (String(err?.message || "").startsWith("Activa inventario")) {
        setError(err.message);
      } else {
        registrarErrorSupabase("guardar gasto diario", err);
        setError(describirErrorSupabase(err, "guardar el gasto"));
      }
    } finally {
      setGuardando(false);
    }
  }

  function editarGasto(gasto) {
    setEditandoId(gasto.id);
    setFormulario({
      numeroFactura: gasto.numeroFactura || "",
      fecha: gasto.fecha || obtenerFechaGastoHoy(),
      proveedor: gasto.proveedor || "",
      articulos: gasto.articulos || "",
      valor: gasto.valor || "",
      categoria: gasto.categoria || "",
      metodoPago: gasto.metodoPago || "",
      observacion: gasto.observacion || ""
    });
    setActualizarInventario(false);
    setLineasInventario([{ insumoId: "", cantidad: "" }]);
    setError("");
    mostrarMensaje("");
    if (!modoRapido) setModalFormularioAbierto(true);
    if (modoRapido) {
      window.requestAnimationFrame(() => {
        if (formularioGastoRef.current) {
          formularioGastoRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }

  async function eliminarGasto(gasto) {
    const confirmar = await confirmarRafiki({
      tipo: "eliminar",
      titulo: "Eliminar gasto",
      mensaje: `Se eliminará el gasto de ${gasto.proveedor || "Sin proveedor"} por $${dinero(gasto.valor)}.\nEsta acción no se puede deshacer.`,
      textoConfirmar: "Eliminar gasto"
    });
    if (!confirmar) return;
    setError("");
    mostrarMensaje("");
    try {
      await eliminarGastoDiario(gasto.id);
      mostrarMensaje("Gasto eliminado correctamente.");
      await cargar(fechaInforme);
    } catch (err) {
      registrarErrorSupabase("eliminar gasto diario", err);
      setError(describirErrorSupabase(err, "eliminar el gasto"));
    }
  }

  const proveedoresFormulario = proveedoresRapidos.length ? proveedoresRapidos : [
    { nombre: "Alexa", categoria: "Trabajadores", descripcionSugerida: "Pago día Alexa" },
    { nombre: "Jesús", categoria: "Trabajadores", descripcionSugerida: "Pago día Jesús" },
    { nombre: "Kathe", categoria: "Trabajadores", descripcionSugerida: "Pago día Kathe" },
    { nombre: "Paola", categoria: "Trabajadores", descripcionSugerida: "Pago día Paola" }
  ];

  const formularioGasto = (
    <form ref={formularioGastoRef} onSubmit={guardarGasto} className="box soft gastos-formulario-box">
      <h3>{editandoId ? "Editar gasto" : "Registrar gasto"}</h3>
      <div className="gastos-recurrentes-rapidos">
        <span className="muted small">Proveedores rápidos</span>
        <div className="gastos-recurrentes-botones">
          {proveedoresFormulario.map((proveedor) => (
            <button key={`${proveedor.nombre}-${proveedor.categoria || "sin-categoria"}`} type="button" className="gastos-recurrente-btn" onClick={() => aplicarGastoRecurrente(proveedor)} disabled={guardando || !supabaseConfigOk}>
              {proveedor.nombre}
            </button>
          ))}
        </div>
      </div>

      <div className="gastos-diarios-grid">
        <label className="field-label">No. factura
          <input value={formulario.numeroFactura} onChange={(e) => cambiarCampo("numeroFactura", e.target.value)} placeholder="Ej: FV-123" />
        </label>
        <label className="field-label">Fecha
          <input type="date" value={formulario.fecha} onChange={(e) => cambiarCampo("fecha", e.target.value)} />
        </label>
        <label className="field-label">Proveedor *
          <input value={formulario.proveedor} onChange={(e) => cambiarCampo("proveedor", e.target.value)} placeholder="Proveedor" required />
        </label>
        <label className="field-label">Valor *
          <input type="number" min="0" step="1" inputMode="numeric" value={formulario.valor} onChange={(e) => cambiarCampo("valor", e.target.value)} placeholder="Ej: 146825" required />
        </label>
        <label className="field-label">Categoría
          <select value={formulario.categoria} onChange={(e) => cambiarCampo("categoria", e.target.value)}>
            <option value="">Seleccionar categoría</option>
            {categoriasCatalogo.map((categoria) => <option key={categoria} value={categoria}>{categoria}</option>)}
          </select>
        </label>
        <label className="field-label">Método de pago
          <select value={formulario.metodoPago} onChange={(e) => cambiarCampo("metodoPago", e.target.value)}>
            <option value="">Seleccionar método</option>
            {METODOS_PAGO_GASTOS.map((metodo) => <option key={metodo} value={metodo}>{metodo}</option>)}
          </select>
        </label>
      </div>

      <label className="field-label" style={{ marginTop: 12 }}>Artículos
        <textarea rows="3" value={formulario.articulos} onChange={(e) => cambiarCampo("articulos", e.target.value)} placeholder="Artículos" />
      </label>

      <div className="gastos-inventario-box">
        <label className="gastos-inventario-toggle">
          <input type="checkbox" checked={actualizarInventario} onChange={(e) => setActualizarInventario(e.target.checked)} disabled={editandoId || !supabaseConfigOk} />
          <span>Actualizar inventario con este gasto <br /><small className="muted">Opcional. Úsalo cuando el gasto sea compra de insumos: pan, pechuga, carne, desechables, verduras, etc.</small></span>
        </label>
        {editandoId ? <div className="alert alert-info" style={{ marginTop: 8 }}>Para evitar duplicar entradas, la actualización de inventario solo se hace al crear un gasto nuevo.</div> : null}
        {actualizarInventario && !editandoId ? (
          <div>
            {lineasInventario.map((linea, indice) => (
              <div className="gastos-inventario-linea" key={`inventario-gasto-${indice}`}>
                <label className="field-label">Insumo
                  <select value={linea.insumoId} onChange={(e) => cambiarLineaInventario(indice, "insumoId", e.target.value)}>
                    <option value="">Seleccionar insumo</option>
                    {insumosInventario.map((insumo) => <option key={insumo.id} value={insumo.id}>{insumo.nombre} · {insumo.unidad}</option>)}
                  </select>
                </label>
                <label className="field-label">Cantidad
                  <input type="number" min="0" step="0.01" value={linea.cantidad} onChange={(e) => cambiarLineaInventario(indice, "cantidad", e.target.value)} placeholder="0" />
                </label>
                <button type="button" className="button light" onClick={() => quitarLineaInventario(indice)}>Quitar</button>
              </div>
            ))}
            <button type="button" className="button light" style={{ marginTop: 10 }} onClick={agregarLineaInventario}>+ Agregar otro insumo</button>
          </div>
        ) : null}
      </div>

      <label className="field-label" style={{ marginTop: 12 }}>Observación
        <textarea rows="2" value={formulario.observacion} onChange={(e) => cambiarCampo("observacion", e.target.value)} placeholder="Observación" />
      </label>

      <div className="admin-actions-stack horizontal" style={{ marginTop: 12 }}>
        <button type="submit" className="button gastos-boton-guardar" disabled={guardando || !supabaseConfigOk}>{guardando ? "Guardando..." : editandoId ? "Actualizar gasto" : "Guardar gasto"}</button>
        <button type="button" className="button light" onClick={limpiarFormulario}>Limpiar</button>
        {!modoRapido ? <button type="button" className="button light" onClick={cerrarFormulario}>Cancelar</button> : null}
      </div>
    </form>
  );

  return (
    <section className={modoRapido ? "card card-pad gastos-diarios-panel gastos-rapidos-panel" : "card card-pad gastos-diarios-panel"}>
<div className="gastos-rapidos-header section-title-row">
        <div>
          <h2>{modoRapido ? "💸 Registrar gasto rápido" : "💸 Gastos Diarios"}</h2>
          {!modoRapido ? <p className="muted">Registra gastos en una ventana enfocada y revisa el informe sin sobrecargar la pantalla.</p> : null}
        </div>
        {!modoRapido ? (
          <div className="gastos-top-actions">
            <button type="button" className="button" onClick={() => abrirFormularioNuevo(obtenerFechaGastoHoy())} disabled={!supabaseConfigOk}>+ Nuevo gasto hoy</button>
            {fechaInforme !== obtenerFechaGastoHoy() ? <button type="button" className="button light" onClick={() => abrirFormularioNuevo(fechaInforme)} disabled={!supabaseConfigOk}>+ Agregar gasto el {fechaLegible(fechaInforme)}</button> : null}
            <button type="button" className="button light" onClick={() => cargar(fechaInforme)} disabled={cargando || !esAdministrador}>{cargando ? "Cargando..." : "Actualizar"}</button>
          </div>
        ) : null}
      </div>

      {!supabaseConfigOk && <div className="alert alert-warning">{supabaseConfigMensaje}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {modoRapido ? formularioGasto : null}

      <RafikiModal
        open={!modoRapido && modalFormularioAbierto}
        title={editandoId ? "Editar gasto" : "Registrar gasto"}
        description="Completa el gasto sin perder la ubicación del informe. Al guardar, la lista se actualizará automáticamente."
        onClose={cerrarFormulario}
        size="lg"
      >
        {formularioGasto}
      </RafikiModal>

      {avisosRafiki}
      {modalConfirmacionRafiki}

      {mostrarInforme && (
      <section className="box" style={{ marginTop: 16 }}>
        <div className="gastos-informe-header">
          <div>
            <h3>📊 Informe de gastos</h3>
            <p className="muted">Consulta y edita los gastos del día seleccionado.</p>
          </div>
          {esAdministrador && (
            <label className="field-label" style={{ minWidth: 190 }}>Fecha del informe
              <input type="date" value={fechaInforme} onChange={(e) => setFechaInforme(e.target.value)} />
            </label>
          )}
        </div>

        {!esAdministrador ? (
          <div className="alert alert-info">El informe de gastos está restringido al rol administrador.</div>
        ) : (
          <>
            <div className="gastos-resumen-mini">
              <div className="gastos-resumen-card"><span className="muted small">Gastos registrados</span><strong>{gastos.length}</strong></div>
              <div className="gastos-resumen-card"><span className="muted small">Total del día</span><strong className="gastos-valor-negativo">${dinero(totalGastos)}</strong></div>
              <div className="gastos-resumen-card"><span className="muted small">Fecha</span><strong>{fechaInforme}</strong></div>
            </div>

            {cargando ? <div className="alert alert-info">Cargando informe de gastos...</div> : null}

            <div className="gastos-acciones" style={{ marginTop: 8, marginBottom: 8 }}>
              <button type="button" className="mini-btn" onClick={() => setMostrarResumenDetallado((valor) => !valor)}>
                {mostrarResumenDetallado ? "Ocultar resumen por categoría" : "Ver resumen por categoría y método"}
              </button>
              <ThermalPrintControls
                onPrint={imprimirGastosTermico}
                disabled={cargando}
                label="Imprimir"
                title="Tamaño"
                buttonClassName="mini-btn print"
              />
            </div>

            {mostrarResumenDetallado ? (
              <div className="gastos-resumen-mini">
                {Object.entries(resumenCategorias).map(([categoria, total]) => (
                  <div className="gastos-resumen-card" key={categoria}><span className="muted small">Categoría: {capitalizar(categoria)}</span><strong>${dinero(total)}</strong></div>
                ))}
                {Object.entries(resumenPagos).map(([metodo, total]) => (
                  <div className="gastos-resumen-card" key={metodo}><span className="muted small">Pago: {capitalizar(metodo)}</span><strong>${dinero(total)}</strong></div>
                ))}
              </div>
            ) : null}

            {!gastos.length && !cargando ? (
              <RafikiEmptyState
                icon="🧾"
                title="No hay gastos para esta fecha"
                description="Cuando registres el primer gasto aparecerá aquí junto con su categoría, método de pago y valor."
                action={<button type="button" className="button" onClick={() => abrirFormularioNuevo(fechaInforme)}>Registrar gasto en esta fecha</button>}
              />
            ) : null}

            {!!gastos.length && (
              <div className="gastos-tabla-wrap">
                <table className="gastos-tabla">
                  <thead>
                    <tr>
                      <th>Proveedor</th><th>Valor</th><th>Artículos</th><th>Categoría</th><th>Pago</th><th>Factura</th><th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gastos.map((gasto) => (
                      <tr key={gasto.id}>
                        <td><strong>{gasto.proveedor}</strong>{gasto.observacion ? <><br /><span className="muted small">{gasto.observacion}</span></> : null}</td>
                        <td><strong className="gastos-valor-negativo">${dinero(gasto.valor)}</strong></td>
                        <td>{gasto.articulos || <span className="muted">Sin detalle</span>}</td>
                        <td><RafikiBadge tipo="neutral">{capitalizar(gasto.categoria)}</RafikiBadge></td>
                        <td><RafikiBadge tipo={tipoMetodoPago(gasto.metodoPago)}>{capitalizar(gasto.metodoPago)}</RafikiBadge></td>
                        <td>{gasto.numeroFactura || "—"}</td>
                        <td>
                          <div className="gastos-acciones">
                            <button type="button" className="button button-small" onClick={() => editarGasto(gasto)}>Editar</button>
                            <RafikiActionMenu
                              label="Opciones"
                              items={[
                                { id: "eliminar", label: "Eliminar gasto", icon: "🗑️", variant: "danger", onClick: () => eliminarGasto(gasto) }
                              ]}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
      )}

      {mostrarInforme && esAdministrador ? (
        <section className="box gastos-analisis" style={{ marginTop: 16 }}>
          <div className="gastos-informe-header">
            <div>
              <h3>📈 Análisis de gastos</h3>
              <p className="muted">Compara proveedores, días y categorías dentro del periodo que necesites.</p>
            </div>
            <button type="button" className="mini-btn green" onClick={exportarAnalisis} disabled={!gastosFiltrados.length}>Exportar lo filtrado</button>
          </div>

          <div className="gastos-filtros">
            <label className="field-label">Desde<input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} /></label>
            <label className="field-label">Hasta<input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} /></label>
            <label className="field-label">Proveedor<select value={filtroProveedor} onChange={(e) => setFiltroProveedor(e.target.value)}><option value="">Todos</option>{proveedoresPeriodo.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="field-label">Categoría<select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}><option value="">Todas</option>{categoriasPeriodo.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="field-label">Método de pago<select value={filtroPago} onChange={(e) => setFiltroPago(e.target.value)}><option value="">Todos</option>{pagosPeriodo.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="field-label">Buscar compra<input value={filtroDetalle} onChange={(e) => setFiltroDetalle(e.target.value)} placeholder="Artículo, factura u observación" /></label>
          </div>
          <div className="gastos-filtros-acciones">
            <button type="button" className="mini-btn" onClick={() => { setFechaInicio(inicioMes(obtenerFechaGastoHoy())); setFechaFin(obtenerFechaGastoHoy()); setFiltroProveedor(""); setFiltroCategoria(""); setFiltroPago(""); setFiltroDetalle(""); }}>Este mes / limpiar filtros</button>
            <span className="muted small">{cargandoPeriodo ? "Actualizando análisis…" : `${gastosFiltrados.length} gastos encontrados`}</span>
          </div>

          <div className="gastos-resumen-mini gastos-metricas-analisis">
            <div className="gastos-resumen-card"><span className="muted small">Total filtrado</span><strong className="gastos-valor-negativo">${dinero(analisisPeriodo.total)}</strong></div>
            <div className="gastos-resumen-card"><span className="muted small">Promedio por día con gastos</span><strong>${dinero(analisisPeriodo.promedioDiario)}</strong></div>
            <div className="gastos-resumen-card"><span className="muted small">Proveedor con mayor gasto</span><strong>{analisisPeriodo.proveedorMayor[0]}</strong><small>${dinero(analisisPeriodo.proveedorMayor[1])}</small></div>
            <div className="gastos-resumen-card"><span className="muted small">Día con mayor gasto</span><strong>{fechaLegible(analisisPeriodo.diaMayor[0])}</strong><small>${dinero(analisisPeriodo.diaMayor[1])}</small></div>
          </div>

          <div className="gastos-comparativos">
            <div className="gastos-ranking"><h4>Por proveedor</h4>{Object.entries(analisisPeriodo.porProveedor).sort((a, b) => b[1] - a[1]).map(([nombre, total]) => <div key={nombre}><span>{nombre}</span><strong>${dinero(total)}</strong></div>)}</div>
            <div className="gastos-ranking"><h4>Por día</h4>{Object.entries(analisisPeriodo.porDia).sort(([a], [b]) => b.localeCompare(a)).map(([fecha, total]) => <div key={fecha}><span>{fechaLegible(fecha)}</span><strong>${dinero(total)}</strong></div>)}</div>
          </div>

          {!!gastosFiltrados.length && <div className="gastos-tabla-wrap"><table className="gastos-tabla"><thead><tr><th>Fecha</th><th>Proveedor</th><th>Comprado</th><th>Categoría</th><th>Pago</th><th>Valor</th></tr></thead><tbody>{gastosFiltrados.map((gasto) => <tr key={`analisis-${gasto.id}`}><td>{fechaLegible(gasto.fecha)}</td><td><strong>{gasto.proveedor}</strong></td><td>{gasto.articulos || "Sin detalle"}</td><td>{capitalizar(gasto.categoria)}</td><td>{capitalizar(gasto.metodoPago)}</td><td><strong className="gastos-valor-negativo">${dinero(gasto.valor)}</strong></td></tr>)}</tbody></table></div>}
          {!gastosFiltrados.length && !cargandoPeriodo ? <RafikiEmptyState icon="📊" title="No hay resultados para estos filtros" description="Amplía el rango o limpia alguno de los filtros para continuar el análisis." /> : null}
        </section>
      ) : null}
    </section>
  );
}
