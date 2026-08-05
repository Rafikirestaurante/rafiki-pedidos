import React, { useCallback, useEffect, useMemo, useState } from "react";
import "../styles/carteraClientesCredito.css";
import {
  activarClienteCredito,
  crearClienteCredito,
  desactivarClienteCredito,
  editarClienteCredito,
  listarClientesCredito,
} from "../../../services/clientesCreditoService";
import {
  listarAbonosCartera,
  listarMovimientosCartera,
  registrarAbonoClienteCredito,
  sincronizarCarteraCompleta,
} from "../../../services/carteraService";
import RafikiActionMenu from "../../../shared/components/RafikiActionMenu";
import CarteraModals from "./CarteraModals";
import RafikiBadge from "../../../shared/components/RafikiBadge";
import RafikiEmptyState from "../../../shared/components/RafikiEmptyState";
import RafikiTabs from "../../../shared/components/RafikiTabs";
import { describirErrorSupabase, registrarErrorSupabase } from "../../../shared/utils/supabaseErrors";
import { aPesosEnteros } from "../../../shared/utils/money";
import {
  esHoyColombia,
  fechaColombiaHaceDias,
  fechaColombiaYYYYMMDD,
} from "../../../shared/utils/fechasColombia";
import { formatearFechaTermica, imprimirReporteTermico } from "../../impresion/thermalReportService";
import ThermalPrintControls from "../../impresion/ThermalPrintControls";

import {
  ABONO_INICIAL,
  FILTROS_INICIALES,
  FORM_INICIAL,
  METODOS_ABONO,
  VISTA_CARTERA_INICIAL,
  conTiempoMaximo,
  construirEstadoCuenta,
  descargarArchivo,
  dinero,
  escaparHtmlExcel,
  estadoCartera,
  fechaDentroRango,
  formatearFecha,
  formatearFechaHora,
  movimientoPendiente,
  nombreArchivoSeguro,
  normalizarTexto,
  resumenPedidoMovimiento,
  resumirAbonosPorMetodo,
  resumirPorEstadoMovimientos,
  saldoMovimiento,
  telefonoWhatsApp,
  textoBusquedaMovimiento,
} from "../utils/carteraViewUtils";

export default function CarteraClientesCredito() {
  const [clientes, setClientes] = useState([]);
  const [movimientosCartera, setMovimientosCartera] = useState([]);
  const [abonosCartera, setAbonosCartera] = useState([]);
  const [busquedaClientes, setBusquedaClientes] = useState("");
  const [mostrarInactivos, setMostrarInactivos] = useState(true);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [cargando, setCargando] = useState(false);
  const [cargandoMovimientos, setCargandoMovimientos] = useState(false);
  const [cargandoAbonos, setCargandoAbonos] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [auditando, setAuditando] = useState(false);
  const [resultadoAuditoria, setResultadoAuditoria] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [formulario, setFormulario] = useState(FORM_INICIAL);
  const [clienteEditandoId, setClienteEditandoId] = useState(null);
  const [clienteDetalleId, setClienteDetalleId] = useState(null);
  const [clienteAbonoId, setClienteAbonoId] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formularioAbono, setFormularioAbono] = useState(ABONO_INICIAL);
  const [abonoPendienteConfirmacion, setAbonoPendienteConfirmacion] = useState(null);
  const [vistaCartera, setVistaCartera] = useState(VISTA_CARTERA_INICIAL);
  const [soloProteinaEstadoCuenta, setSoloProteinaEstadoCuenta] = useState(false);

  const cargarClientes = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const data = await conTiempoMaximo(
        listarClientesCredito({ busqueda: busquedaClientes, incluirInactivos: mostrarInactivos }),
        15000,
        "Clientes de cartera"
      );
      setClientes(Array.isArray(data) ? data : []);
    } catch (err) {
      registrarErrorSupabase("cargar clientes crédito", err);
      setError(describirErrorSupabase(err, "cargar los clientes de cartera"));
      setClientes([]);
    } finally {
      setCargando(false);
    }
  }, [busquedaClientes, mostrarInactivos]);

  const cargarMovimientos = useCallback(async ({ sincronizar = false } = {}) => {
    setCargandoMovimientos(true);
    try {
      let resultadoSync = null;
      if (sincronizar) {
        resultadoSync = await conTiempoMaximo(
          sincronizarCarteraCompleta({ limite: 2000 }),
          30000,
          "Auditoría automática de cartera"
        );
        setResultadoAuditoria(resultadoSync);
        if (Number(resultadoSync?.totalCorrecciones || 0) > 0) {
          setMensaje(`Auditoría aplicada: ${resultadoSync.totalCorrecciones} corrección(es), ${resultadoSync.anulados} movimiento(s) anulados y ${resultadoSync.valoresAjustados} saldo(s) ajustados.`);
        }
      }

      const data = await conTiempoMaximo(
        listarMovimientosCartera({ estado: "todos", limite: 2000 }),
        18000,
        "Movimientos de cartera"
      );
      setMovimientosCartera(Array.isArray(data) ? data : []);

      if (Number(resultadoSync?.totalCorrecciones || 0) > 0) {
        await cargarClientes();
      }
    } catch (err) {
      registrarErrorSupabase("cargar movimientos de cartera", err);
      setError(describirErrorSupabase(err, "cargar los movimientos de cartera"));
      setMovimientosCartera([]);
    } finally {
      setCargandoMovimientos(false);
    }
  }, [cargarClientes]);

  const cargarAbonos = useCallback(async () => {
    setCargandoAbonos(true);
    try {
      const data = await conTiempoMaximo(
        listarAbonosCartera({ limite: 1500 }),
        15000,
        "Abonos de cartera"
      );
      setAbonosCartera(Array.isArray(data) ? data : []);
    } catch (err) {
      registrarErrorSupabase("cargar abonos de cartera", err);
      setError(describirErrorSupabase(err, "cargar los abonos de cartera"));
      setAbonosCartera([]);
    } finally {
      setCargandoAbonos(false);
    }
  }, []);

  const actualizarTodo = useCallback(async () => {
    setMensaje("");
    await Promise.allSettled([cargarClientes(), cargarMovimientos({ sincronizar: false }), cargarAbonos()]);
  }, [cargarClientes, cargarMovimientos, cargarAbonos]);

  const auditarCartera = useCallback(async () => {
    if (auditando) return;
    setAuditando(true);
    setMensaje("");
    setError("");
    try {
      const resultado = await conTiempoMaximo(
        sincronizarCarteraCompleta({ limite: 3000 }),
        45000,
        "Auditoría manual de cartera"
      );
      setResultadoAuditoria(resultado);
      await Promise.all([cargarClientes(), cargarMovimientos({ sincronizar: false }), cargarAbonos()]);
      if (Number(resultado?.totalCorrecciones || 0) > 0) {
        setMensaje(`Auditoría finalizada: ${resultado.totalCorrecciones} corrección(es), ${resultado.anulados} movimiento(s) anulados, ${resultado.valoresAjustados} saldo(s) ajustados y ${resultado.clientesRecalculados?.length || 0} cliente(s) recalculados.`);
      } else {
        setMensaje("Auditoría finalizada: no se encontraron diferencias. La cartera está sincronizada.");
      }
    } catch (err) {
      registrarErrorSupabase("completar auditoría de cartera", err);
      setError(describirErrorSupabase(err, "completar la auditoría de cartera"));
    } finally {
      setAuditando(false);
    }
  }, [auditando, cargarAbonos, cargarClientes, cargarMovimientos]);

  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  useEffect(() => {
    cargarMovimientos();
  }, [cargarMovimientos]);

  useEffect(() => {
    cargarAbonos();
  }, [cargarAbonos]);

  const clienteEditando = useMemo(
    () => clientes.find((cliente) => cliente.id === clienteEditandoId) || null,
    [clientes, clienteEditandoId]
  );

  const clienteDetalle = useMemo(
    () => clientes.find((cliente) => cliente.id === clienteDetalleId) || null,
    [clientes, clienteDetalleId]
  );

  const clienteAbono = useMemo(
    () => clientes.find((cliente) => cliente.id === clienteAbonoId) || null,
    [clientes, clienteAbonoId]
  );

  const hayFiltroFechaMovimientos = Boolean(filtros.fechaInicio || filtros.fechaFin);

  const movimientosFiltrados = useMemo(() => {
    const texto = normalizarTexto(filtros.texto);
    const pedido = normalizarTexto(filtros.pedido);
    const descripcion = normalizarTexto(filtros.descripcion);

    return movimientosCartera.filter((movimiento) => {
      const estado = estadoCartera(movimiento);
      if (filtros.estado !== "todos" && estado !== filtros.estado) return false;
      if (filtros.clienteId && String(movimiento.cliente_credito_id || "") !== String(filtros.clienteId)) return false;
      if (!fechaDentroRango(movimiento.fecha_movimiento || movimiento.created_at, filtros.fechaInicio, filtros.fechaFin)) return false;
      if (texto && !normalizarTexto(textoBusquedaMovimiento(movimiento)).includes(texto)) return false;
      if (pedido && !normalizarTexto(movimiento.numero_pedido).includes(pedido.replace(/^#/, ""))) return false;
      if (descripcion && !normalizarTexto(resumenPedidoMovimiento(movimiento)).includes(descripcion)) return false;
      return true;
    });
  }, [filtros, movimientosCartera]);

  const clientesVisibles = useMemo(() => {
    const texto = normalizarTexto(busquedaClientes);
    return clientes.filter((cliente) => {
      if (!mostrarInactivos && cliente.activo === false) return false;
      if (filtros.soloConSaldo && Number(cliente.saldo_pendiente || 0) <= 0) return false;
      if (!texto) return true;
      return normalizarTexto([
        cliente.nombre,
        cliente.telefono,
        cliente.observaciones,
        ...(Array.isArray(cliente.alias) ? cliente.alias : []),
      ].filter(Boolean).join(" ")).includes(texto);
    });
  }, [busquedaClientes, clientes, filtros.soloConSaldo, mostrarInactivos]);

  const clientesParaFiltroMovimientos = useMemo(() => {
    return [...clientes]
      .filter((cliente) => cliente?.id && cliente?.nombre)
      .sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), "es", { sensitivity: "base" }));
  }, [clientes]);

  const clienteFiltradoMovimientos = useMemo(() => {
    if (!filtros.clienteId) return null;
    return clientes.find((cliente) => String(cliente.id || "") === String(filtros.clienteId)) || null;
  }, [clientes, filtros.clienteId]);

  const indicadores = useMemo(() => {
    const activos = clientes.filter((cliente) => cliente.activo !== false);
    const clientesConSaldo = clientes.filter((cliente) => Number(cliente.saldo_pendiente || 0) > 0);
    const saldoTotal = clientes.reduce((total, cliente) => total + Number(cliente.saldo_pendiente || 0), 0);
    const pedidosPendientes = movimientosCartera.filter(movimientoPendiente).length;
    const carteraPagada = abonosCartera.reduce((total, abono) => total + Number(abono.valor_abono || 0), 0);
    const creditosOtorgadosHoy = movimientosCartera.reduce((total, movimiento) => {
      if (estadoCartera(movimiento) === "anulado") return total;
      if (!esHoyColombia(movimiento.fecha_movimiento || movimiento.created_at)) return total;
      return total + aPesosEnteros(movimiento.valor);
    }, 0);
    const abonosRecibidosHoy = abonosCartera.reduce((total, abono) => {
      if (!esHoyColombia(abono.fecha_abono || abono.created_at)) return total;
      return total + aPesosEnteros(abono.valor_abono);
    }, 0);
    const valorOriginalFiltrado = movimientosFiltrados.reduce((total, movimiento) => {
      if (estadoCartera(movimiento) === "anulado") return total;
      return total + aPesosEnteros(movimiento.valor);
    }, 0);
    const saldoFiltrado = movimientosFiltrados.reduce((total, movimiento) => {
      if (!movimientoPendiente(movimiento)) return total;
      return total + saldoMovimiento(movimiento);
    }, 0);

    return {
      activos: activos.length,
      clientesConSaldo: clientesConSaldo.length,
      saldoTotal,
      pedidosPendientes,
      carteraPagada,
      abonosRecibidos: abonosCartera.length,
      creditosOtorgadosHoy,
      abonosRecibidosHoy,
      valorOriginalFiltrado,
      saldoFiltrado,
      movimientosFiltrados: movimientosFiltrados.length,
    };
  }, [abonosCartera, clientes, movimientosCartera, movimientosFiltrados]);

  const rankingClientes = useMemo(() => {
    const activos = clientes.filter((cliente) => cliente.activo !== false);
    const topSaldo = [...activos]
      .filter((cliente) => Number(cliente.saldo_pendiente || 0) > 0)
      .sort((a, b) => Number(b.saldo_pendiente || 0) - Number(a.saldo_pendiente || 0))
      .slice(0, 5);
    const recientes = [...activos]
      .filter((cliente) => cliente.fecha_ultimo_pedido)
      .sort((a, b) => new Date(b.fecha_ultimo_pedido).getTime() - new Date(a.fecha_ultimo_pedido).getTime())
      .slice(0, 5);
    const sinTelefono = [...activos]
      .filter((cliente) => Number(cliente.saldo_pendiente || 0) > 0 && !String(cliente.telefono || "").trim())
      .sort((a, b) => Number(b.saldo_pendiente || 0) - Number(a.saldo_pendiente || 0))
      .slice(0, 5);
    return { topSaldo, recientes, sinTelefono };
  }, [clientes]);

  const movimientosClienteDetalle = useMemo(() => {
    if (!clienteDetalleId) return [];
    return movimientosCartera.filter((movimiento) => movimiento.cliente_credito_id === clienteDetalleId);
  }, [clienteDetalleId, movimientosCartera]);

  const abonosClienteDetalle = useMemo(() => {
    if (!clienteDetalleId) return [];
    return abonosCartera.filter((abono) => abono.cliente_credito_id === clienteDetalleId);
  }, [abonosCartera, clienteDetalleId]);

  const resumenDetalle = useMemo(() => {
    const total = movimientosClienteDetalle.reduce((acum, movimiento) => acum + Number(movimiento.valor || 0), 0);
    const saldo = movimientosClienteDetalle.reduce((acum, movimiento) => {
      if (!movimientoPendiente(movimiento)) return acum;
      return acum + saldoMovimiento(movimiento);
    }, 0);
    const pendientes = movimientosClienteDetalle.filter(movimientoPendiente).length;
    const abonado = abonosClienteDetalle.reduce((acum, abono) => acum + Number(abono.valor_abono || 0), 0);
    return { total, saldo, pendientes, abonado };
  }, [abonosClienteDetalle, movimientosClienteDetalle]);

  const estadoCuentaCliente = useMemo(
    () => construirEstadoCuenta(movimientosClienteDetalle, abonosClienteDetalle, { soloProteina: soloProteinaEstadoCuenta }),
    [abonosClienteDetalle, movimientosClienteDetalle, soloProteinaEstadoCuenta]
  );

  function abrirEstadoCuenta(clienteId) {
    setClienteDetalleId(clienteId || null);
    setVistaCartera("estado-cuenta");
  }

  function limpiarFormulario() {
    setFormulario(FORM_INICIAL);
    setClienteEditandoId(null);
    setMostrarFormulario(false);
  }

  function abrirNuevoCliente() {
    setFormulario(FORM_INICIAL);
    setClienteEditandoId(null);
    setMostrarFormulario(true);
    setMensaje("");
    setError("");
  }

  function cambiarCampo(campo, valor) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  }

  function cambiarFiltro(campo, valor) {
    setFiltros((actual) => ({ ...actual, [campo]: valor }));
  }

  function filtrosBaseMovimientosConClienteActual() {
    return { ...FILTROS_INICIALES, clienteId: filtros.clienteId || "" };
  }

  function aplicarFiltroCreditosHoy() {
    const hoy = fechaColombiaYYYYMMDD();
    setFiltros({ ...filtrosBaseMovimientosConClienteActual(), estado: "todos", fechaInicio: hoy, fechaFin: hoy, soloConSaldo: false });
  }

  function aplicarFiltroAyer() {
    const ayer = fechaColombiaHaceDias(1);
    setFiltros({ ...filtrosBaseMovimientosConClienteActual(), estado: "todos", fechaInicio: ayer, fechaFin: ayer, soloConSaldo: false });
  }

  function aplicarFiltroUltimos7Dias() {
    setFiltros({
      ...filtrosBaseMovimientosConClienteActual(),
      estado: "todos",
      fechaInicio: fechaColombiaHaceDias(6),
      fechaFin: fechaColombiaYYYYMMDD(),
      soloConSaldo: false,
    });
  }

  function aplicarFiltroPendientes() {
    setFiltros({ ...filtrosBaseMovimientosConClienteActual(), estado: "pendiente", soloConSaldo: true });
  }


  function descripcionFiltrosMovimientos() {
    const partes = [];
    if (clienteFiltradoMovimientos?.nombre) partes.push(`Cliente: ${clienteFiltradoMovimientos.nombre}`);
    if (filtros.fechaInicio || filtros.fechaFin) partes.push(`Fechas: ${filtros.fechaInicio || "inicio"} a ${filtros.fechaFin || "hoy"}`);
    if (filtros.estado && filtros.estado !== "todos") partes.push(`Estado: ${filtros.estado}`);
    if (filtros.texto) partes.push(`Búsqueda: ${filtros.texto}`);
    if (filtros.pedido) partes.push(`Pedido: ${filtros.pedido}`);
    if (filtros.descripcion) partes.push(`Descripción: ${filtros.descripcion}`);
    return partes.length ? partes.join(" · ") : "Todos los movimientos filtrados";
  }

  function exportarMovimientosExcel() {
    const encabezados = ["Fecha", "Pedido", "Cliente", "Descripción del pedido", "Valor", "Estado", "Saldo"];
    const filas = movimientosFiltrados.map((movimiento) => [
      formatearFechaHora(movimiento.fecha_movimiento || movimiento.created_at),
      movimiento.numero_pedido ? `#${movimiento.numero_pedido}` : "—",
      movimiento.cliente_nombre || "—",
      resumenPedidoMovimiento(movimiento),
      Number(movimiento.valor || 0),
      estadoCartera(movimiento),
      saldoMovimiento(movimiento),
    ]);

    const resumen = [
      ["Movimientos de cartera", ""],
      ["Fecha de exportación", formatearFechaHora(new Date())],
      ["Filtros", descripcionFiltrosMovimientos()],
      ["Movimientos", indicadores.movimientosFiltrados],
      ["Valor filtrado", indicadores.valorOriginalFiltrado],
      ["Saldo filtrado", indicadores.saldoFiltrado],
      ["", ""],
    ];

    const tabla = [...resumen, encabezados, ...filas]
      .map((fila, indiceFila) => `<tr>${fila.map((celda) => {
        const etiqueta = indiceFila === resumen.length ? "th" : "td";
        return `<${etiqueta}>${escaparHtmlExcel(celda)}</${etiqueta}>`;
      }).join("")}</tr>`)
      .join("");

    const contenido = `<!doctype html>
<html>
<head><meta charset="utf-8" /></head>
<body>
<table border="1">${tabla}</table>
</body>
</html>`;

    const clienteArchivo = clienteFiltradoMovimientos?.nombre ? `-${nombreArchivoSeguro(clienteFiltradoMovimientos.nombre)}` : "";
    descargarArchivo(`movimientos-cartera${clienteArchivo}-${fechaColombiaYYYYMMDD()}.xls`, contenido);
  }

  function exportarCarteraActualExcel() {
    const encabezados = ["Cliente", "Teléfono", "Último pedido", "Pedidos", "Saldo pendiente", "Estado", "Observaciones"];
    const filas = clientesVisibles.map((cliente) => [
      cliente.nombre || "—", cliente.telefono || "—", formatearFecha(cliente.fecha_ultimo_pedido),
      Number(cliente.total_pedidos || 0), Number(cliente.saldo_pendiente || 0),
      cliente.activo === false ? "Inactivo" : "Activo", cliente.observaciones || "—",
    ]);
    const tabla = [encabezados, ...filas].map((fila, indice) => `<tr>${fila.map((celda) => `<${indice === 0 ? "th" : "td"}>${escaparHtmlExcel(celda)}</${indice === 0 ? "th" : "td"}>`).join("")}</tr>`).join("");
    descargarArchivo(`cartera-actual-${fechaColombiaYYYYMMDD()}.xls`, `<!doctype html><html><head><meta charset="utf-8" /></head><body><h2>Cartera actual</h2><p>Saldo total: ${escaparHtmlExcel(dinero(indicadores.saldoTotal))}</p><table border="1">${tabla}</table></body></html>`);
  }

  function exportarEstadoCuentaExcel() {
    if (!clienteDetalle) return;
    const encabezados = ["Fecha", "Referencia", "Descripción", "Pedido a crédito", "Pago recibido", "Saldo pendiente"];
    const filas = estadoCuentaCliente.map((linea) => [formatearFechaHora(linea.fecha), linea.referencia, linea.descripcion, linea.pedido || "", linea.pago || "", linea.saldo]);
    const tabla = [encabezados, ...filas].map((fila, indice) => `<tr>${fila.map((celda) => `<${indice === 0 ? "th" : "td"}>${escaparHtmlExcel(celda)}</${indice === 0 ? "th" : "td"}>`).join("")}</tr>`).join("");
    descargarArchivo(`estado-cuenta-${nombreArchivoSeguro(clienteDetalle.nombre)}-${fechaColombiaYYYYMMDD()}.xls`, `<!doctype html><html><head><meta charset="utf-8" /></head><body><h2>Estado de cuenta: ${escaparHtmlExcel(clienteDetalle.nombre)}</h2><p>Saldo actual: ${escaparHtmlExcel(dinero(clienteDetalle.saldo_pendiente))}</p><table border="1">${tabla}</table></body></html>`);
  }

  function exportarAbonosExcel() {
    const abonosFiltrados = abonosCartera.filter((abono) => {
      if (filtros.clienteId && String(abono.cliente_credito_id || "") !== String(filtros.clienteId)) return false;
      return fechaDentroRango(abono.fecha_abono || abono.created_at, filtros.fechaInicio, filtros.fechaFin);
    });
    const encabezados = ["Fecha", "Cliente", "Pedido aplicado", "Pago recibido", "Método", "Saldo anterior", "Saldo posterior", "Observación"];
    const filas = abonosFiltrados.map((abono) => [formatearFechaHora(abono.fecha_abono || abono.created_at), abono.cliente_nombre || "—", abono.numero_pedido ? `#${abono.numero_pedido}` : "—", Number(abono.valor_abono || 0), abono.metodo_pago || "—", Number(abono.saldo_anterior || 0), Number(abono.saldo_nuevo || 0), abono.observacion || "—"]);
    const tabla = [encabezados, ...filas].map((fila, indice) => `<tr>${fila.map((celda) => `<${indice === 0 ? "th" : "td"}>${escaparHtmlExcel(celda)}</${indice === 0 ? "th" : "td"}>`).join("")}</tr>`).join("");
    descargarArchivo(`abonos-cartera-${fechaColombiaYYYYMMDD()}.xls`, `<!doctype html><html><head><meta charset="utf-8" /></head><body><h2>Abonos recibidos</h2><table border="1">${tabla}</table></body></html>`);
  }

  function construirTextoMovimientosWhatsApp() {
    const limite = 25;
    const lineas = [];
    const saludoCliente = clienteFiltradoMovimientos?.nombre ? `Hola ${clienteFiltradoMovimientos.nombre},` : "Hola,";
    lineas.push(saludoCliente);
    lineas.push("Te compartimos el resumen de movimientos de cartera Rafiki.");
    lineas.push("");
    lineas.push(`*Filtros:* ${descripcionFiltrosMovimientos()}`);
    lineas.push(`*Movimientos:* ${indicadores.movimientosFiltrados}`);
    lineas.push(`*Valor filtrado:* ${dinero(indicadores.valorOriginalFiltrado)}`);
    lineas.push(`*Saldo filtrado:* ${dinero(indicadores.saldoFiltrado)}`);

    if (movimientosFiltrados.length > 0) {
      lineas.push("");
      lineas.push("*Detalle:* ");
      movimientosFiltrados.slice(0, limite).forEach((movimiento) => {
        lineas.push(`- ${formatearFecha(movimiento.fecha_movimiento || movimiento.created_at)} · Pedido #${movimiento.numero_pedido || "—"} · ${resumenPedidoMovimiento(movimiento)} · Valor ${dinero(movimiento.valor)} · Saldo ${dinero(saldoMovimiento(movimiento))} · ${estadoCartera(movimiento)}`);
      });
      if (movimientosFiltrados.length > limite) {
        lineas.push(`... y ${movimientosFiltrados.length - limite} movimiento(s) más. Para el detalle completo, revisa el archivo de Excel exportado desde Rafiki.`);
      }
    }

    return lineas.join("\n");
  }

  function compartirMovimientosWhatsApp() {
    const texto = encodeURIComponent(construirTextoMovimientosWhatsApp());
    const telefono = telefonoWhatsApp(clienteFiltradoMovimientos?.telefono);
    const url = telefono ? `https://wa.me/${telefono}?text=${texto}` : `https://wa.me/?text=${texto}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function imprimirResumenCarteraTermico(formato = "80") {
    const topSaldo = rankingClientes.topSaldo || [];
    const recientes = rankingClientes.recientes || [];
    const ok = imprimirReporteTermico({
      formato,
      titulo: "Cartera",
      subtitulo: "Rafiki Gerencia · Resumen",
      meta: [
        { etiqueta: "Fecha impresión", valor: formatearFechaTermica(new Date()) },
        { etiqueta: "Clientes activos", valor: indicadores.activos },
        { etiqueta: "Clientes con saldo", valor: indicadores.clientesConSaldo },
        { etiqueta: "Movimientos cargados", valor: movimientosCartera.length },
      ],
      secciones: [
        {
          titulo: "Resumen general",
          filas: [
            { etiqueta: "Créditos otorgados hoy", valor: dinero(indicadores.creditosOtorgadosHoy), fuerte: true },
            { etiqueta: "Abonos recibidos hoy", valor: dinero(indicadores.abonosRecibidosHoy), fuerte: true },
            { etiqueta: "Cartera pendiente total", valor: dinero(indicadores.saldoTotal), fuerte: true },
            { etiqueta: "Clientes con saldo", valor: indicadores.clientesConSaldo },
            { etiqueta: "Pedidos pendientes", valor: indicadores.pedidosPendientes },
            { etiqueta: "Abonos acumulados", valor: dinero(indicadores.carteraPagada) },
            { etiqueta: "Cantidad de abonos", valor: indicadores.abonosRecibidos },
            { etiqueta: "Saldo según filtros", valor: dinero(indicadores.saldoFiltrado) },
          ],
        },
        {
          titulo: "Abonos por método",
          filas: resumirAbonosPorMetodo(abonosCartera),
        },
      ],
      listado: {
        titulo: "Top saldos pendientes",
        modo: "tabla",
        vacio: "Sin clientes activos con saldo pendiente.",
        items: topSaldo,
        campos: [
          { etiqueta: "Cliente", ancho: "44%", fuerte: true, valor: (cliente) => cliente.nombre || "Sin nombre" },
          { etiqueta: "Teléfono", ancho: "28%", valor: (cliente) => cliente.telefono || "Sin teléfono" },
          { etiqueta: "Saldo", ancho: "28%", alinear: "right", fuerte: true, valor: (cliente) => dinero(cliente.saldo_pendiente) },
        ],
      },
      pie: `Clientes recientes: ${recientes.length} · tabla compacta 58 mm / 80 mm`,
    });

    if (!ok) setError("No se pudo abrir la ventana de impresión. Revisa si el navegador bloqueó ventanas emergentes.");
  }

  function imprimirMovimientosCarteraTermico(formato = "80") {
    const lista = Array.isArray(movimientosFiltrados) ? movimientosFiltrados : [];
    const ok = imprimirReporteTermico({
      formato,
      titulo: "Movimientos cartera",
      subtitulo: "Rafiki Gerencia · Cartera",
      meta: [
        { etiqueta: "Fecha impresión", valor: formatearFechaTermica(new Date()) },
        { etiqueta: "Filtros", valor: descripcionFiltrosMovimientos() },
        { etiqueta: "Movimientos", valor: indicadores.movimientosFiltrados },
        { etiqueta: "Valor filtrado", valor: dinero(indicadores.valorOriginalFiltrado) },
        { etiqueta: "Saldo filtrado", valor: dinero(indicadores.saldoFiltrado) },
      ],
      secciones: [
        {
          titulo: "Resumen filtrado",
          filas: [
            { etiqueta: "Movimientos", valor: indicadores.movimientosFiltrados, fuerte: true },
            { etiqueta: "Valor filtrado", valor: dinero(indicadores.valorOriginalFiltrado), fuerte: true },
            { etiqueta: "Saldo filtrado", valor: dinero(indicadores.saldoFiltrado), fuerte: true },
            { etiqueta: "Cliente", valor: clienteFiltradoMovimientos?.nombre || "Todos los clientes" },
            { etiqueta: "Estado", valor: filtros.estado === "todos" ? "Todos los estados" : filtros.estado },
            { etiqueta: "Rango", valor: `${filtros.fechaInicio || "inicio"} a ${filtros.fechaFin || "hoy"}` },
          ],
        },
        {
          titulo: "Por estado",
          filas: resumirPorEstadoMovimientos(lista),
        },
      ],
      listado: {
        titulo: "Detalle movimientos",
        modo: "tabla",
        vacio: "Sin movimientos para imprimir con estos filtros.",
        items: lista,
        campos: [
          { etiqueta: "Pedido", ancho: "17%", fuerte: true, valor: (movimiento) => movimiento.numero_pedido ? `#${movimiento.numero_pedido}` : "—" },
          { etiqueta: "Cliente", ancho: "35%", valor: (movimiento) => movimiento.cliente_nombre || "—" },
          { etiqueta: "Estado", ancho: "22%", valor: (movimiento) => estadoCartera(movimiento) },
          { etiqueta: "Saldo", ancho: "26%", alinear: "right", fuerte: true, valor: (movimiento) => dinero(saldoMovimiento(movimiento)) },
        ],
      },
      pie: "Cartera · tabla compacta 58 mm / 80 mm",
    });

    if (!ok) setError("No se pudo abrir la ventana de impresión. Revisa si el navegador bloqueó ventanas emergentes.");
  }

  function cambiarCampoAbono(campo, valor) {
    setFormularioAbono((actual) => ({ ...actual, [campo]: valor }));
  }

  function abrirAbono(cliente) {
    if (!cliente?.id || Number(cliente.saldo_pendiente || 0) <= 0) return;
    setClienteDetalleId(cliente.id);
    setClienteAbonoId(cliente.id);
    setFormularioAbono(ABONO_INICIAL);
    setMensaje("");
    setError("");
  }

  function cerrarAbono() {
    if (guardando) return;
    setAbonoPendienteConfirmacion(null);
    setClienteAbonoId(null);
    setFormularioAbono(ABONO_INICIAL);
  }

  async function guardarAbono(evento) {
    evento.preventDefault();
    if (!clienteAbono?.id) return;

    const valor = aPesosEnteros(formularioAbono.valorAbono);
    if (!Number.isFinite(valor) || valor <= 0) {
      setError("El valor del abono debe ser mayor a cero.");
      return;
    }

    const saldoPendiente = aPesosEnteros(clienteAbono.saldo_pendiente);
    if (valor > saldoPendiente) {
      setError("El abono no puede ser mayor al saldo pendiente del cliente.");
      return;
    }

    setMensaje("");
    setError("");
    setAbonoPendienteConfirmacion({
      clienteId: clienteAbono.id,
      clienteNombre: clienteAbono.nombre,
      saldoPendiente,
      valor,
      metodoPago: formularioAbono.metodoPago,
      observacion: formularioAbono.observacion,
      fechaAbono: formularioAbono.fechaAbono,
    });
  }

  async function confirmarRegistroAbono() {
    const abono = abonoPendienteConfirmacion;
    if (!abono?.clienteId || guardando) return;

    setGuardando(true);
    setMensaje("");
    setError("");

    try {
      await registrarAbonoClienteCredito({
        clienteId: abono.clienteId,
        valorAbono: abono.valor,
        metodoPago: abono.metodoPago,
        observacion: abono.observacion,
        fechaAbono: abono.fechaAbono,
      });
      setMensaje("Abono registrado correctamente. La cartera fue actualizada.");
      setAbonoPendienteConfirmacion(null);
      setClienteAbonoId(null);
      setFormularioAbono(ABONO_INICIAL);
      await actualizarTodo();
    } catch (err) {
      registrarErrorSupabase("registrar abono de cartera", err);
      setError(describirErrorSupabase(err, "registrar el abono"));
    } finally {
      setGuardando(false);
    }
  }

  function editar(cliente) {
    setClienteEditandoId(cliente.id);
    setFormulario({
      nombre: cliente.nombre || "",
      telefono: cliente.telefono || "",
      observaciones: cliente.observaciones || "",
    });
    setMostrarFormulario(true);
    setMensaje("");
    setError("");
  }

  async function guardarCliente(evento) {
    evento.preventDefault();
    if (!formulario.nombre.trim()) {
      setError("El nombre del cliente es obligatorio.");
      return;
    }

    setGuardando(true);
    setMensaje("");
    setError("");

    try {
      if (clienteEditandoId) {
        await editarClienteCredito(clienteEditandoId, formulario);
        setMensaje("Cliente crédito actualizado correctamente.");
      } else {
        await crearClienteCredito(formulario);
        setMensaje("Cliente crédito creado correctamente.");
      }
      limpiarFormulario();
      await cargarClientes();
    } catch (err) {
      registrarErrorSupabase("guardar cliente crédito", err);
      setError(describirErrorSupabase(err, "guardar el cliente crédito"));
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(cliente) {
    setGuardando(true);
    setMensaje("");
    setError("");
    try {
      if (cliente.activo === false) {
        await activarClienteCredito(cliente.id);
        setMensaje("Cliente activado correctamente.");
      } else {
        await desactivarClienteCredito(cliente.id);
        setMensaje("Cliente desactivado correctamente.");
      }
      await cargarClientes();
    } catch (err) {
      registrarErrorSupabase("cambiar estado cliente crédito", err);
      setError(describirErrorSupabase(err, "cambiar el estado del cliente"));
    } finally {
      setGuardando(false);
    }
  }

  function abrirWhatsApp(cliente) {
    const telefono = telefonoWhatsApp(cliente.telefono);
    if (!telefono) return;
    const mensajeRecordatorio = encodeURIComponent(
      `Hola ${cliente.nombre}, te saludamos de Rafiki. Te compartimos el recordatorio de tu saldo pendiente en cartera: ${dinero(cliente.saldo_pendiente)}.`
    );
    window.open(`https://wa.me/${telefono}?text=${mensajeRecordatorio}`, "_blank", "noopener,noreferrer");
  }

  const tabsCartera = [
    { id: "cartera", label: "Cartera actual", icon: "👥", count: clientesVisibles.length },
    { id: "estado-cuenta", label: "Estado de cuenta", icon: "📄", count: clienteDetalle ? estadoCuentaCliente.length : null },
    { id: "historial", label: "Historial", icon: "🧾", count: indicadores.movimientosFiltrados },
  ];

  return (
    <section className="cartera-clientes-panel cartera-profesional-panel cartera-ui-limpia">
<div className="section-heading section-heading-pedidos-unificados">
        <div>
          <h2>Cartera</h2>
          <p className="muted small">Control gerencial de clientes crédito, saldos pendientes y pedidos asociados.</p>
        </div>
        <div className="cartera-actions" style={{ marginTop: 0 }}>
          <button type="button" className="mini-btn print" style={{ width: "auto", marginBottom: 0 }} onClick={actualizarTodo} disabled={cargando || cargandoMovimientos || cargandoAbonos || auditando}>
            {cargando || cargandoMovimientos || cargandoAbonos ? "Actualizando..." : "Actualizar cartera"}
          </button>
          <button type="button" className="mini-btn green" style={{ width: "auto", marginBottom: 0 }} onClick={auditarCartera} disabled={cargando || cargandoMovimientos || cargandoAbonos || auditando}>
            {auditando ? "Auditando..." : "Auditar cartera"}
          </button>
          <button type="button" className="mini-btn" style={{ width: "auto", marginBottom: 0 }} onClick={abrirNuevoCliente} disabled={auditando}>
            + Nuevo cliente
          </button>
          <ThermalPrintControls
            onPrint={imprimirResumenCarteraTermico}
            label="Resumen"
            title="Tamaño"
            buttonClassName="mini-btn print"
            className="cartera-thermal-control"
            compact
          />
        </div>
      </div>

      {mensaje && <div className="alert success" style={{ marginTop: 10 }}>{mensaje}</div>}
      {error && <div className="alert error" style={{ marginTop: 10 }}>{error}</div>}

      <RafikiTabs tabs={tabsCartera} activeTab={vistaCartera} onChange={setVistaCartera} ariaLabel="Secciones de cartera" />

      <CarteraModals
        mostrarFormulario={mostrarFormulario}
        clienteEditando={clienteEditando}
        limpiarFormulario={limpiarFormulario}
        guardarCliente={guardarCliente}
        formulario={formulario}
        cambiarCampo={cambiarCampo}
        guardando={guardando}
        clienteAbono={clienteAbono}
        cerrarAbono={cerrarAbono}
        guardarAbono={guardarAbono}
        formularioAbono={formularioAbono}
        cambiarCampoAbono={cambiarCampoAbono}
        metodosAbono={METODOS_ABONO}
        abonoPendienteConfirmacion={abonoPendienteConfirmacion}
        cerrarConfirmacionAbono={() => !guardando && setAbonoPendienteConfirmacion(null)}
        confirmarRegistroAbono={confirmarRegistroAbono}
      />

      {vistaCartera === "cartera" && (
        <section className="card card-pad cartera-resumen-card">
          <div className="cartera-indicadores">
            <div className="cartera-indicador"><small>Créditos otorgados hoy</small><strong>{dinero(indicadores.creditosOtorgadosHoy)}</strong></div>
            <div className="cartera-indicador neutral"><small>Abonos recibidos hoy</small><strong>{dinero(indicadores.abonosRecibidosHoy)}</strong></div>
            <div className="cartera-indicador"><small>Cartera pendiente total</small><strong>{dinero(indicadores.saldoTotal)}</strong></div>
            <div className="cartera-indicador"><small>Clientes con saldo</small><strong>{indicadores.clientesConSaldo}</strong></div>
            
          </div>

          {resultadoAuditoria && (
            <div className="auditoria-resumen">
              <strong>Última auditoría de cartera</strong>
              <span>Revisados: {resultadoAuditoria.movimientosRevisados || 0}</span>
              <span>Anulados: {resultadoAuditoria.anulados || 0}</span>
              <span>Borrados: {resultadoAuditoria.anuladosBorrados || 0}</span>
              <span>No crédito: {resultadoAuditoria.anuladosNoCredito || 0}</span>
              <span>Huérfanos: {resultadoAuditoria.anuladosHuerfanos || 0}</span>
              <span>Duplicados: {resultadoAuditoria.duplicadosAnulados || 0}</span>
              <span>Saldos ajustados: {resultadoAuditoria.valoresAjustados || 0}</span>
            </div>
          )}
        </section>
      )}

      {vistaCartera === "cartera" && (
        <section className="card card-pad" style={{ marginTop: 12 }}>
          <div className="section-heading section-heading-pedidos-unificados">
            <div>
              <h3>Cartera actual</h3>
              <p className="muted small">Consulta saldos, registra pagos y abre el estado de cuenta de cada cliente.</p>
            </div>
          </div>

          <div className="cartera-filtros">
            <input value={busquedaClientes} onChange={(e) => setBusquedaClientes(e.target.value)} placeholder="Buscar cliente, teléfono u observación" />
            <button type="button" className="mini-btn" style={{ width: "auto", marginBottom: 0 }} onClick={() => cambiarFiltro("soloConSaldo", !filtros.soloConSaldo)}>
              {filtros.soloConSaldo ? "Ver todos" : "Solo con saldo"}
            </button>
            <button type="button" className="mini-btn" style={{ width: "auto", marginBottom: 0 }} onClick={() => setMostrarInactivos((valor) => !valor)}>
              {mostrarInactivos ? "Ocultar inactivos" : "Mostrar inactivos"}
            </button>
            <button type="button" className="mini-btn print" style={{ width: "auto", marginBottom: 0 }} onClick={cargarClientes} disabled={cargando}>
              {cargando ? "Cargando..." : "Actualizar clientes"}
            </button>
            <button type="button" className="mini-btn green" style={{ width: "auto", marginBottom: 0 }} onClick={exportarCarteraActualExcel} disabled={clientesVisibles.length === 0}>Exportar cartera actual</button>
          </div>

          <div className="pedidos-tabla-wrap">
            <table className="pedidos-tabla-compacta">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Teléfono</th>
                  <th>Último pedido</th>
                  <th>Total pedidos</th>
                  <th>Saldo pendiente</th>
                  <th>Estado</th>
                  <th>Observaciones</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {clientesVisibles.length === 0 ? (
                  <tr><td colSpan="8"><RafikiEmptyState icon="👥" title={cargando ? "Cargando clientes..." : "Sin clientes visibles"} description={cargando ? "Estamos consultando el directorio de clientes crédito." : "No hay clientes para los filtros actuales. Puedes limpiar filtros o crear un cliente nuevo."} /></td></tr>
                ) : clientesVisibles.map((cliente) => {
                  const whatsapp = telefonoWhatsApp(cliente.telefono);
                  const saldoPendiente = Number(cliente.saldo_pendiente || 0);
                  return (
                    <tr key={cliente.id} className={cliente.activo === false ? "fila-borrada" : ""}>
                      <td><strong>{cliente.nombre}</strong><small>{Array.isArray(cliente.alias) && cliente.alias.length ? cliente.alias.join(", ") : "Sin alias"}</small></td>
                      <td>{cliente.telefono || "—"}</td>
                      <td>{formatearFecha(cliente.fecha_ultimo_pedido)}</td>
                      <td>{Number(cliente.total_pedidos || 0)}</td>
                      <td className={`td-total ${saldoPendiente > 0 ? "saldo-pendiente" : "saldo-cero"}`}>{dinero(cliente.saldo_pendiente)}</td>
                      <td><RafikiBadge estado={cliente.activo === false ? "Inactivo" : "Activo"} /></td>
                      <td className="td-obs">{cliente.observaciones || "—"}</td>
                      <td className="td-acciones">
                        <button type="button" className="mini-btn green" onClick={() => abrirAbono(cliente)} disabled={guardando || saldoPendiente <= 0}>Abono</button>
                        <RafikiActionMenu
                          disabled={guardando}
                          items={[
                            { id: "ver", label: "Ver estado de cuenta", icon: "🔎", variant: "info", onClick: () => abrirEstadoCuenta(cliente.id) },
                            { id: "editar", label: "Editar cliente", icon: "✏️", onClick: () => editar(cliente) },
                            whatsapp ? { id: "whatsapp", label: "Enviar WhatsApp", icon: "💬", variant: "success", disabled: saldoPendiente <= 0, onClick: () => abrirWhatsApp(cliente) } : null,
                            { id: "estado", label: cliente.activo === false ? "Activar cliente" : "Desactivar cliente", icon: cliente.activo === false ? "✅" : "🚫", variant: cliente.activo === false ? "success" : "danger", onClick: () => cambiarEstado(cliente) },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {vistaCartera === "historial" && (
        <section className="card card-pad" style={{ marginTop: 12 }}>
          <div className="section-heading section-heading-pedidos-unificados">
            <div>
              <h3>Historial de cartera</h3>
              <p className="muted small">Filtra por cliente, pedido, estado o rango de fechas. Los cortes se calculan con horario Colombia para evitar descuadres al cierre.</p>
            </div>
            <div className="cartera-movimientos-resumen">
              <div className="cartera-resumen-chip"><span>Movimientos</span><strong>{indicadores.movimientosFiltrados}</strong></div>
              <div className="cartera-resumen-chip"><span>Valor filtrado</span><strong title={dinero(indicadores.valorOriginalFiltrado)}>{dinero(indicadores.valorOriginalFiltrado)}</strong></div>
              <div className="cartera-resumen-chip"><span>Saldo filtrado</span><strong title={dinero(indicadores.saldoFiltrado)}>{dinero(indicadores.saldoFiltrado)}</strong></div>
            </div>
          </div>

          <div className="cartera-quick-filters" aria-label="Filtros rápidos de movimientos">
            <button type="button" className="mini-btn green" style={{ width: "auto", marginBottom: 0 }} onClick={aplicarFiltroCreditosHoy}>Créditos de hoy</button>
            <button type="button" className="mini-btn" style={{ width: "auto", marginBottom: 0 }} onClick={aplicarFiltroAyer}>Ayer</button>
            <button type="button" className="mini-btn" style={{ width: "auto", marginBottom: 0 }} onClick={aplicarFiltroUltimos7Dias}>Últimos 7 días</button>
            <button type="button" className="mini-btn" style={{ width: "auto", marginBottom: 0 }} onClick={aplicarFiltroPendientes}>Pendientes</button>
            {hayFiltroFechaMovimientos && <span className="muted small">Mostrando auditoría por fecha: los créditos pagados se mantienen visibles.</span>}
          </div>

          <div className="cartera-filtros">
            <input value={filtros.texto} onChange={(e) => cambiarFiltro("texto", e.target.value)} placeholder="Búsqueda general" />
            <input value={filtros.pedido} onChange={(e) => cambiarFiltro("pedido", e.target.value)} placeholder="Filtrar por pedido" aria-label="Filtrar por número de pedido" />
            <input value={filtros.descripcion} onChange={(e) => cambiarFiltro("descripcion", e.target.value)} placeholder="Filtrar por producto" aria-label="Filtrar por descripción del pedido" />
            <select value={filtros.clienteId} onChange={(e) => cambiarFiltro("clienteId", e.target.value)} aria-label="Filtrar movimientos por cliente">
              <option value="">Todos los clientes</option>
              {clientesParaFiltroMovimientos.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>
              ))}
            </select>
            <select value={filtros.estado} onChange={(e) => cambiarFiltro("estado", e.target.value)}>
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="parcial">Parcial</option>
              <option value="pagado">Pagado</option>
              <option value="anulado">Anulado</option>
            </select>
            <input type="date" value={filtros.fechaInicio} onChange={(e) => cambiarFiltro("fechaInicio", e.target.value)} />
            <input type="date" value={filtros.fechaFin} onChange={(e) => cambiarFiltro("fechaFin", e.target.value)} />
          </div>
          <div className="cartera-actions">
            <button type="button" className="mini-btn" style={{ width: "auto", marginBottom: 0 }} onClick={() => setFiltros(FILTROS_INICIALES)}>Limpiar filtros</button>
            <button type="button" className="mini-btn print" style={{ width: "auto", marginBottom: 0 }} onClick={cargarMovimientos} disabled={cargandoMovimientos}>
              {cargandoMovimientos ? "Cargando..." : "Actualizar movimientos"}
            </button>
            <button type="button" className="mini-btn green" style={{ width: "auto", marginBottom: 0 }} onClick={exportarMovimientosExcel} disabled={movimientosFiltrados.length === 0}>
              Exportar pedidos filtrados
            </button>
            <button type="button" className="mini-btn green" style={{ width: "auto", marginBottom: 0 }} onClick={exportarAbonosExcel} disabled={abonosCartera.length === 0}>Exportar abonos filtrados</button>
            <button type="button" className="mini-btn" style={{ width: "auto", marginBottom: 0 }} onClick={compartirMovimientosWhatsApp} disabled={movimientosFiltrados.length === 0}>
              Compartir WhatsApp
            </button>
            <ThermalPrintControls
              onPrint={imprimirMovimientosCarteraTermico}
              disabled={movimientosFiltrados.length === 0}
              label="Imprimir"
              title="Tamaño"
              buttonClassName="mini-btn print"
              className="cartera-thermal-control"
              compact
            />
          </div>
          <p className="muted small" style={{ margin: "4px 0 0" }}>WhatsApp comparte un resumen en texto. Para enviar el archivo completo, exporta Excel y adjúntalo manualmente.</p>

          <div className="pedidos-tabla-wrap" style={{ marginTop: 10 }}>
            <table className="pedidos-tabla-compacta">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Descripción del pedido</th>
                  <th>Valor</th>
                  <th>Estado</th>
                  <th>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {movimientosFiltrados.length === 0 ? (
                  <tr><td colSpan="7"><RafikiEmptyState icon="🧾" title={cargandoMovimientos ? "Cargando movimientos..." : "Sin movimientos"} description={cargandoMovimientos ? "Estamos consultando los movimientos de cartera." : "No hay movimientos para los filtros actuales."} /></td></tr>
                ) : movimientosFiltrados.slice(0, 300).map((movimiento) => {
                  const estado = estadoCartera(movimiento);
                  const saldoPendiente = saldoMovimiento(movimiento);
                  return (
                    <tr key={movimiento.id} className={!hayFiltroFechaMovimientos && !movimientoPendiente(movimiento) ? "subtle-row" : ""}>
                      <td>{formatearFechaHora(movimiento.fecha_movimiento || movimiento.created_at)}</td>
                      <td>#{movimiento.numero_pedido || "—"}</td>
                      <td>{movimiento.cliente_nombre || "—"}</td>
                      <td className="td-pedido-detalle">{resumenPedidoMovimiento(movimiento)}<small>{movimiento.pedido_items?.length ? `${movimiento.pedido_items.length} item(s)` : "Detalle compacto"}</small></td>
                      <td className="td-total">{dinero(movimiento.valor)}</td>
                      <td><RafikiBadge estado={estado} /></td>
                      <td className={`td-total ${saldoPendiente > 0 && estado !== "pagado" && estado !== "anulado" ? "saldo-pendiente" : "saldo-cero"}`}>{dinero(movimiento.saldo_movimiento)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {movimientosFiltrados.length > 300 && <p className="muted small">Se muestran los primeros 300 movimientos. Usa filtros para acotar la búsqueda.</p>}
        </section>
      )}

      {vistaCartera === "estado-cuenta" && (
        <section className="detalle-cartera">
          {!clienteDetalle ? (
            <div className="card card-pad">
              <div className="section-heading section-heading-pedidos-unificados">
                <div><h3>Estado de cuenta</h3><p className="muted small">Selecciona un cliente para consultar sus pedidos a crédito y pagos recibidos.</p></div>
              </div>
              <div className="cartera-filtros">
                <select value="" onChange={(e) => abrirEstadoCuenta(e.target.value)} aria-label="Seleccionar cliente para estado de cuenta">
                  <option value="">Seleccionar cliente</option>
                  {clientesParaFiltroMovimientos.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>)}
                </select>
              </div>
              <RafikiEmptyState icon="🔎" title="Selecciona un cliente" description="También puedes abrir esta pestaña desde la opción Ver estado de cuenta en Cartera actual." />
            </div>
          ) : (
            <>
              <div className="section-heading section-heading-pedidos-unificados">
                <div>
                  <h3>Estado de cuenta de {clienteDetalle.nombre}</h3>
                  <p className="muted small">Pedidos a crédito y pagos recibidos en una sola secuencia.</p>
                </div>
                <div className="cartera-actions" style={{ marginTop: 0 }}>
                  <select value={clienteDetalleId || ""} onChange={(e) => abrirEstadoCuenta(e.target.value)} aria-label="Cambiar cliente del estado de cuenta">
                    {clientesParaFiltroMovimientos.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>)}
                  </select>
                  <button type="button" className={`mini-btn ${soloProteinaEstadoCuenta ? "green" : ""}`} style={{ width: "auto", marginBottom: 0 }} onClick={() => setSoloProteinaEstadoCuenta((actual) => !actual)} aria-pressed={soloProteinaEstadoCuenta}>
                    {soloProteinaEstadoCuenta ? "✓ Solo proteína" : "Solo proteína"}
                  </button>
                  <button type="button" className="mini-btn green" style={{ width: "auto", marginBottom: 0 }} onClick={() => abrirAbono(clienteDetalle)} disabled={Number(clienteDetalle.saldo_pendiente || 0) <= 0}>Registrar abono</button>
                  <button type="button" className="mini-btn print" style={{ width: "auto", marginBottom: 0 }} onClick={exportarEstadoCuentaExcel} disabled={estadoCuentaCliente.length === 0}>Exportar estado de cuenta</button>
                </div>
              </div>

              <div className="cartera-indicadores" style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}>
                <div className="cartera-indicador"><small>Saldo actual cliente</small><strong>{dinero(clienteDetalle.saldo_pendiente)}</strong></div>
                <div className="cartera-indicador"><small>Total comprado a crédito</small><strong>{dinero(resumenDetalle.total)}</strong></div>
                <div className="cartera-indicador neutral"><small>Abonado</small><strong className="abono-valor">{dinero(resumenDetalle.abonado)}</strong></div>
                <div className="cartera-indicador neutral"><small>Pedidos pendientes</small><strong>{resumenDetalle.pendientes}</strong></div>
              </div>

              <div className="pedidos-tabla-wrap">
                <table className="pedidos-tabla-compacta">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Referencia</th>
                      <th>Descripción</th>
                      <th>Pedido a crédito</th>
                      <th>Pago recibido</th>
                      <th>Saldo pendiente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estadoCuentaCliente.length === 0 ? (
                      <tr><td colSpan="6"><RafikiEmptyState icon="🧾" title="Sin movimientos" description="Este cliente aún no tiene pedidos a crédito ni pagos registrados." /></td></tr>
                    ) : estadoCuentaCliente.map((linea) => (
                      <tr key={linea.id} className={linea.tipo === "Pago recibido" ? "subtle-row" : ""}>
                        <td>{formatearFechaHora(linea.fecha)}</td>
                        <td>{linea.referencia}</td>
                        <td className="td-pedido-detalle">{linea.descripcion}</td>
                        <td className="td-total">{linea.pedido ? dinero(linea.pedido) : "—"}</td>
                        <td className="td-total abono-valor">{linea.pago ? dinero(linea.pago) : "—"}</td>
                        <td className={`td-total ${linea.saldo > 0 ? "saldo-pendiente" : "saldo-cero"}`}>{dinero(linea.saldo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}
    </section>
  );
}
