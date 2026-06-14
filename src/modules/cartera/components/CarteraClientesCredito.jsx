import React, { useCallback, useEffect, useMemo, useState } from "react";
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

const FORM_INICIAL = {
  nombre: "",
  telefono: "",
  observaciones: "",
};

const FILTROS_INICIALES = {
  texto: "",
  estado: "todos",
  fechaInicio: "",
  fechaFin: "",
  soloConSaldo: true,
};

const METODOS_ABONO = ["Efectivo", "Transferencia", "Datafono", "Nequi", "Bancolombia", "Otro"];

function fechaHoyInput() {
  const fecha = new Date();
  const yyyy = fecha.getFullYear();
  const mm = String(fecha.getMonth() + 1).padStart(2, "0");
  const dd = String(fecha.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const ABONO_INICIAL = {
  valorAbono: "",
  metodoPago: "Efectivo",
  observacion: "",
  fechaAbono: fechaHoyInput(),
};

function dinero(valor) {
  return Number(valor || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatearFecha(valor) {
  if (!valor) return "—";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "—";
  return fecha.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatearFechaHora(valor) {
  if (!valor) return "—";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "—";
  return fecha.toLocaleString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fechaDentroRango(valor, fechaInicio, fechaFin) {
  if (!fechaInicio && !fechaFin) return true;
  if (!valor) return false;

  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return false;

  if (fechaInicio) {
    const inicio = new Date(`${fechaInicio}T00:00:00`);
    if (fecha < inicio) return false;
  }

  if (fechaFin) {
    const fin = new Date(`${fechaFin}T23:59:59.999`);
    if (fecha > fin) return false;
  }

  return true;
}

function estadoCartera(movimiento) {
  return String(movimiento?.estado || "pendiente").trim().toLowerCase();
}

function saldoMovimiento(movimiento) {
  return Number(movimiento?.saldo_movimiento ?? movimiento?.valor ?? 0) || 0;
}

function movimientoPendiente(movimiento) {
  const estado = estadoCartera(movimiento);
  return estado !== "pagado" && estado !== "anulado" && saldoMovimiento(movimiento) > 0;
}

function telefonoWhatsApp(telefono) {
  const digitos = String(telefono || "").replace(/\D/g, "");
  if (!digitos) return "";
  if (digitos.length === 10) return `57${digitos}`;
  return digitos;
}

function textoBusquedaMovimiento(movimiento) {
  return [
    movimiento.numero_pedido,
    movimiento.cliente_nombre,
    movimiento.concepto,
    movimiento.estado,
    movimiento.observaciones,
  ]
    .filter(Boolean)
    .join(" ");
}

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

  const cargarClientes = useCallback(async () => {
    setCargando(true);
    setError("");
    const data = await listarClientesCredito({ busqueda: busquedaClientes, incluirInactivos: mostrarInactivos });
    setClientes(data);
    setCargando(false);
  }, [busquedaClientes, mostrarInactivos]);

  const cargarMovimientos = useCallback(async ({ sincronizar = true } = {}) => {
    setCargandoMovimientos(true);
    try {
      let resultadoSync = null;
      if (sincronizar) {
        resultadoSync = await sincronizarCarteraCompleta({ limite: 2000 });
        setResultadoAuditoria(resultadoSync);
        if (Number(resultadoSync?.totalCorrecciones || 0) > 0) {
          setMensaje(`Auditoría aplicada: ${resultadoSync.totalCorrecciones} corrección(es), ${resultadoSync.anulados} movimiento(s) anulados y ${resultadoSync.valoresAjustados} saldo(s) ajustados.`);
        }
      }

      const data = await listarMovimientosCartera({ estado: "todos", limite: 2000 });
      setMovimientosCartera(data);

      if (Number(resultadoSync?.totalCorrecciones || 0) > 0) {
        await cargarClientes();
      }
    } catch (err) {
      const detalle = err?.message ? ` ${err.message}` : "";
      setError(`No se pudo auditar y sincronizar la cartera.${detalle}`);
    } finally {
      setCargandoMovimientos(false);
    }
  }, [cargarClientes]);

  const cargarAbonos = useCallback(async () => {
    setCargandoAbonos(true);
    const data = await listarAbonosCartera({ limite: 1500 });
    setAbonosCartera(data);
    setCargandoAbonos(false);
  }, []);

  const actualizarTodo = useCallback(async () => {
    await Promise.all([cargarClientes(), cargarMovimientos(), cargarAbonos()]);
  }, [cargarClientes, cargarMovimientos, cargarAbonos]);

  const auditarCartera = useCallback(async () => {
    if (auditando) return;
    setAuditando(true);
    setMensaje("");
    setError("");
    try {
      const resultado = await sincronizarCarteraCompleta({ limite: 3000 });
      setResultadoAuditoria(resultado);
      await Promise.all([cargarClientes(), cargarMovimientos({ sincronizar: false }), cargarAbonos()]);
      if (Number(resultado?.totalCorrecciones || 0) > 0) {
        setMensaje(`Auditoría finalizada: ${resultado.totalCorrecciones} corrección(es), ${resultado.anulados} movimiento(s) anulados, ${resultado.valoresAjustados} saldo(s) ajustados y ${resultado.clientesRecalculados?.length || 0} cliente(s) recalculados.`);
      } else {
        setMensaje("Auditoría finalizada: no se encontraron diferencias. La cartera está sincronizada.");
      }
    } catch (err) {
      const detalle = err?.message ? ` ${err.message}` : "";
      setError(`No se pudo completar la auditoría de cartera.${detalle}`);
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

  const movimientosFiltrados = useMemo(() => {
    const texto = normalizarTexto(filtros.texto);

    return movimientosCartera.filter((movimiento) => {
      const estado = estadoCartera(movimiento);
      if (filtros.estado !== "todos" && estado !== filtros.estado) return false;
      if (!fechaDentroRango(movimiento.fecha_movimiento || movimiento.created_at, filtros.fechaInicio, filtros.fechaFin)) return false;
      if (texto && !normalizarTexto(textoBusquedaMovimiento(movimiento)).includes(texto)) return false;
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

  const indicadores = useMemo(() => {
    const activos = clientes.filter((cliente) => cliente.activo !== false);
    const clientesConSaldo = clientes.filter((cliente) => Number(cliente.saldo_pendiente || 0) > 0);
    const saldoTotal = clientes.reduce((total, cliente) => total + Number(cliente.saldo_pendiente || 0), 0);
    const pedidosPendientes = movimientosCartera.filter(movimientoPendiente).length;
    const carteraPagada = abonosCartera.reduce((total, abono) => total + Number(abono.valor_abono || 0), 0);
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
    return movimientosFiltrados.filter((movimiento) => movimiento.cliente_credito_id === clienteDetalleId);
  }, [clienteDetalleId, movimientosFiltrados]);

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

  function limpiarFormulario() {
    setFormulario(FORM_INICIAL);
    setClienteEditandoId(null);
    setMostrarFormulario(false);
  }

  function cambiarCampo(campo, valor) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  }

  function cambiarFiltro(campo, valor) {
    setFiltros((actual) => ({ ...actual, [campo]: valor }));
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
    setClienteAbonoId(null);
    setFormularioAbono(ABONO_INICIAL);
  }

  async function guardarAbono(evento) {
    evento.preventDefault();
    if (!clienteAbono?.id) return;

    const valor = Number(formularioAbono.valorAbono || 0);
    if (!Number.isFinite(valor) || valor <= 0) {
      setError("El valor del abono debe ser mayor a cero.");
      return;
    }

    if (valor > Number(clienteAbono.saldo_pendiente || 0)) {
      setError("El abono no puede ser mayor al saldo pendiente del cliente.");
      return;
    }

    const confirmado = window.confirm(`¿Confirmas registrar este abono por ${dinero(valor)} para ${clienteAbono.nombre}?`);
    if (!confirmado) return;

    setGuardando(true);
    setMensaje("");
    setError("");

    try {
      await registrarAbonoClienteCredito({
        clienteId: clienteAbono.id,
        valorAbono: valor,
        metodoPago: formularioAbono.metodoPago,
        observacion: formularioAbono.observacion,
        fechaAbono: formularioAbono.fechaAbono,
      });
      setMensaje("Abono registrado correctamente. La cartera fue actualizada.");
      cerrarAbono();
      await actualizarTodo();
    } catch (err) {
      const detalle = err?.message ? ` ${err.message}` : "";
      setError(`No se pudo registrar el abono.${detalle}`);
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
      const detalle = err?.message ? ` ${err.message}` : "";
      setError(`No se pudo guardar el cliente.${detalle}`);
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
      const detalle = err?.message ? ` ${err.message}` : "";
      setError(`No se pudo cambiar el estado del cliente.${detalle}`);
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

  return (
    <section className="cartera-clientes-panel cartera-profesional-panel">
      <style>{`
        .cartera-profesional-panel .cartera-indicadores { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 10px; margin: 12px 0; }
        .cartera-profesional-panel .cartera-indicador { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 16px; padding: 12px; }
        .cartera-profesional-panel .cartera-indicador small { display: block; color: #9a3412; font-weight: 800; margin-bottom: 4px; }
        .cartera-profesional-panel .cartera-indicador strong { display: block; font-size: 18px; color: #431407; line-height: 1.15; }
        .cartera-profesional-panel .cartera-indicador.neutral { background: #f8fafc; border-color: #e2e8f0; }
        .cartera-profesional-panel .cartera-indicador.neutral small { color: #475569; }
        .cartera-profesional-panel .cartera-indicador.neutral strong { color: #0f172a; }
        .cartera-profesional-panel .cartera-form { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 10px; align-items: end; margin-top: 10px; }
        .cartera-profesional-panel .abono-form { border: 1px solid #bbf7d0; background: #f0fdf4; border-radius: 18px; padding: 12px; margin-top: 12px; }
        .cartera-profesional-panel .abono-form-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; align-items: end; }
        .cartera-profesional-panel .cartera-form textarea { grid-column: 1 / -1; }
        .cartera-profesional-panel input, .cartera-profesional-panel textarea, .cartera-profesional-panel select { width: 100%; min-height: 44px; border: 1px solid #e7e5e4; border-radius: 14px; padding: 10px 12px; font: inherit; background: #fff; }
        .cartera-profesional-panel textarea { min-height: 76px; resize: vertical; }
        .cartera-profesional-panel .cartera-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
        .cartera-profesional-panel .cartera-filtros { display: grid; grid-template-columns: minmax(220px, 1.2fr) repeat(3, minmax(140px, 0.5fr)); gap: 8px; align-items: center; margin: 14px 0 8px; }
        .cartera-profesional-panel .estado-cliente, .cartera-profesional-panel .estado-movimiento { display: inline-block; border-radius: 999px; padding: 3px 8px; font-size: 11px; font-weight: 900; background: #dcfce7; color: #166534; text-transform: capitalize; }
        .cartera-profesional-panel .estado-cliente.inactivo { background: #fee2e2; color: #991b1b; }
        .cartera-profesional-panel .estado-movimiento.pendiente { background: #ffedd5; color: #9a3412; }
        .cartera-profesional-panel .estado-movimiento.parcial { background: #dbeafe; color: #1d4ed8; }
        .cartera-profesional-panel .estado-movimiento.pagado { background: #dcfce7; color: #166534; }
        .cartera-profesional-panel .estado-movimiento.anulado { background: #fee2e2; color: #991b1b; }
        .cartera-profesional-panel .pedidos-tabla-compacta { min-width: 980px; }
        .cartera-profesional-panel .detalle-cartera { margin-top: 14px; border: 1px solid #fed7aa; border-radius: 18px; background: #fffaf5; padding: 12px; }
        .cartera-profesional-panel .detalle-cartera h3 { margin: 0 0 8px; }
        .cartera-profesional-panel .detalle-cartera table { min-width: 780px; }
        .cartera-profesional-panel .ranking-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin: 12px 0; }
        .cartera-profesional-panel .ranking-card { border: 1px solid #e7e5e4; background: #fff; border-radius: 16px; padding: 12px; }
        .cartera-profesional-panel .ranking-card h3 { margin: 0 0 8px; font-size: 16px; }
        .cartera-profesional-panel .ranking-list { display: grid; gap: 8px; }
        .cartera-profesional-panel .ranking-item { display: flex; justify-content: space-between; gap: 10px; border-top: 1px dashed #e7e5e4; padding-top: 8px; }
        .cartera-profesional-panel .ranking-item:first-child { border-top: 0; padding-top: 0; }
        .cartera-profesional-panel .ranking-item strong, .cartera-profesional-panel td strong { display: block; }
        .cartera-profesional-panel .ranking-item small, .cartera-profesional-panel td small { display: block; color: #78716c; font-size: 11px; margin-top: 2px; }
        .cartera-profesional-panel .td-acciones { min-width: 230px; }
        .cartera-profesional-panel .subtle-row { background: #fffaf5; }
        .cartera-profesional-panel .auditoria-resumen { border: 1px solid #bfdbfe; background: #eff6ff; color: #1e3a8a; border-radius: 16px; padding: 10px 12px; margin-top: 10px; }
        .cartera-profesional-panel .auditoria-resumen strong { display: block; margin-bottom: 4px; }
        .cartera-profesional-panel .auditoria-resumen span { display: inline-block; margin-right: 12px; font-size: 12px; font-weight: 800; }
        @media (max-width: 980px) { .cartera-profesional-panel .cartera-indicadores { grid-template-columns: repeat(2, minmax(0, 1fr)); } .cartera-profesional-panel .ranking-grid { grid-template-columns: 1fr; } .cartera-profesional-panel .cartera-filtros, .cartera-profesional-panel .abono-form-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 760px) { .cartera-profesional-panel .cartera-indicadores, .cartera-profesional-panel .cartera-form, .cartera-profesional-panel .cartera-filtros, .cartera-profesional-panel .abono-form-grid { grid-template-columns: 1fr; } .cartera-profesional-panel .cartera-form textarea { grid-column: auto; } }
      `}</style>

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
          <button type="button" className="mini-btn" style={{ width: "auto", marginBottom: 0 }} onClick={() => setMostrarFormulario((valor) => !valor)} disabled={auditando}>
            {mostrarFormulario ? "Cerrar cliente" : "+ Nuevo cliente"}
          </button>
        </div>
      </div>

      <div className="cartera-indicadores">
        <div className="cartera-indicador"><small>Cartera pendiente total</small><strong>{dinero(indicadores.saldoTotal)}</strong></div>
        <div className="cartera-indicador"><small>Clientes con saldo</small><strong>{indicadores.clientesConSaldo}</strong></div>
        <div className="cartera-indicador"><small>Pedidos pendientes</small><strong>{indicadores.pedidosPendientes}</strong></div>
        <div className="cartera-indicador neutral"><small>Abonos recibidos</small><strong>{dinero(indicadores.carteraPagada)}</strong></div>
        <div className="cartera-indicador neutral"><small>Cantidad de abonos</small><strong>{indicadores.abonosRecibidos}</strong></div>
        <div className="cartera-indicador neutral"><small>Saldo según filtros</small><strong>{dinero(indicadores.saldoFiltrado)}</strong></div>
      </div>

      <div className="ranking-grid">
        <article className="ranking-card">
          <h3>Top saldos pendientes</h3>
          <div className="ranking-list">
            {rankingClientes.topSaldo.length === 0 ? <p className="muted small">Sin saldos pendientes.</p> : rankingClientes.topSaldo.map((cliente) => (
              <div key={cliente.id} className="ranking-item">
                <span><strong>{cliente.nombre}</strong><small>{cliente.telefono || "Sin teléfono"}</small></span>
                <strong>{dinero(cliente.saldo_pendiente)}</strong>
              </div>
            ))}
          </div>
        </article>
        <article className="ranking-card">
          <h3>Créditos recientes</h3>
          <div className="ranking-list">
            {rankingClientes.recientes.length === 0 ? <p className="muted small">Sin créditos recientes.</p> : rankingClientes.recientes.map((cliente) => (
              <div key={cliente.id} className="ranking-item">
                <span><strong>{cliente.nombre}</strong><small>Último pedido: {formatearFecha(cliente.fecha_ultimo_pedido)}</small></span>
                <strong>{dinero(cliente.saldo_pendiente)}</strong>
              </div>
            ))}
          </div>
        </article>
        <article className="ranking-card">
          <h3>Clientes sin teléfono</h3>
          <div className="ranking-list">
            {rankingClientes.sinTelefono.length === 0 ? <p className="muted small">Todos los saldos tienen teléfono.</p> : rankingClientes.sinTelefono.map((cliente) => (
              <div key={cliente.id} className="ranking-item">
                <span><strong>{cliente.nombre}</strong><small>{Number(cliente.total_pedidos || 0)} pedido(s)</small></span>
                <strong>{dinero(cliente.saldo_pendiente)}</strong>
              </div>
            ))}
          </div>
        </article>
      </div>

      {mostrarFormulario && (
        <form className="card card-pad" onSubmit={guardarCliente}>
          <h3>{clienteEditando ? "Editar cliente" : "+ Nuevo cliente"}</h3>
          <div className="cartera-form">
            <input value={formulario.nombre} onChange={(e) => cambiarCampo("nombre", e.target.value)} placeholder="Nombre del cliente" />
            <input value={formulario.telefono} onChange={(e) => cambiarCampo("telefono", e.target.value)} placeholder="Teléfono" />
            <textarea value={formulario.observaciones} onChange={(e) => cambiarCampo("observaciones", e.target.value)} placeholder="Observaciones" />
          </div>
          <div className="cartera-actions">
            <button type="submit" className="button" disabled={guardando}>{guardando ? "Guardando..." : clienteEditando ? "Guardar cambios" : "Crear cliente"}</button>
            <button type="button" className="button light" onClick={limpiarFormulario}>Cancelar</button>
          </div>
        </form>
      )}

      {mensaje && <div className="alert success" style={{ marginTop: 10 }}>{mensaje}</div>}
      {error && <div className="alert error" style={{ marginTop: 10 }}>{error}</div>}
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

      {clienteAbono && (
        <form className="abono-form" onSubmit={guardarAbono}>
          <div className="section-heading section-heading-pedidos-unificados">
            <div>
              <h3>Registrar abono</h3>
              <p className="muted small">{clienteAbono.nombre} debe actualmente {dinero(clienteAbono.saldo_pendiente)}. El abono se aplica automáticamente a los pedidos más antiguos.</p>
            </div>
            <button type="button" className="mini-btn" style={{ width: "auto", marginBottom: 0 }} onClick={cerrarAbono} disabled={guardando}>Cerrar</button>
          </div>
          <div className="abono-form-grid">
            <label>
              Valor del abono
              <input type="number" min="0" step="100" value={formularioAbono.valorAbono} onChange={(e) => cambiarCampoAbono("valorAbono", e.target.value)} placeholder="Ej. 50000" required />
            </label>
            <label>
              Método de pago
              <select value={formularioAbono.metodoPago} onChange={(e) => cambiarCampoAbono("metodoPago", e.target.value)}>
                {METODOS_ABONO.map((metodo) => <option key={metodo} value={metodo}>{metodo}</option>)}
              </select>
            </label>
            <label>
              Fecha
              <input type="date" value={formularioAbono.fechaAbono} onChange={(e) => cambiarCampoAbono("fechaAbono", e.target.value)} />
            </label>
            <label>
              Observación
              <input value={formularioAbono.observacion} onChange={(e) => cambiarCampoAbono("observacion", e.target.value)} placeholder="Opcional" />
            </label>
          </div>
          <div className="cartera-actions">
            <button type="submit" className="mini-btn green" style={{ width: "auto", marginBottom: 0 }} disabled={guardando}>{guardando ? "Guardando..." : "Guardar abono"}</button>
            <button type="button" className="mini-btn" style={{ width: "auto", marginBottom: 0 }} onClick={cerrarAbono} disabled={guardando}>Cancelar</button>
          </div>
        </form>
      )}

      <section className="card card-pad" style={{ marginTop: 12 }}>
        <div className="section-heading section-heading-pedidos-unificados">
          <div>
            <h3>Clientes con crédito</h3>
            <p className="muted small">Consulta saldos, estado, teléfono y detalle de pedidos por cliente.</p>
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
                <tr><td colSpan="8">{cargando ? "Cargando clientes..." : "Sin clientes para los filtros actuales."}</td></tr>
              ) : clientesVisibles.map((cliente) => {
                const whatsapp = telefonoWhatsApp(cliente.telefono);
                return (
                  <tr key={cliente.id} className={cliente.activo === false ? "fila-borrada" : ""}>
                    <td><strong>{cliente.nombre}</strong><small>{Array.isArray(cliente.alias) && cliente.alias.length ? cliente.alias.join(", ") : "Sin alias"}</small></td>
                    <td>{cliente.telefono || "—"}</td>
                    <td>{formatearFecha(cliente.fecha_ultimo_pedido)}</td>
                    <td>{Number(cliente.total_pedidos || 0)}</td>
                    <td className="td-total">{dinero(cliente.saldo_pendiente)}</td>
                    <td><span className={`estado-cliente ${cliente.activo === false ? "inactivo" : ""}`}>{cliente.activo === false ? "Inactivo" : "Activo"}</span></td>
                    <td className="td-obs">{cliente.observaciones || "—"}</td>
                    <td className="td-acciones">
                      <button type="button" className="mini-btn print" onClick={() => setClienteDetalleId(cliente.id)} disabled={guardando}>Ver cartera</button>
                      <button type="button" className="mini-btn green" onClick={() => abrirAbono(cliente)} disabled={guardando || Number(cliente.saldo_pendiente || 0) <= 0}>Abono</button>
                      <button type="button" className="mini-btn" onClick={() => editar(cliente)} disabled={guardando}>Editar</button>
                      {whatsapp && <button type="button" className="mini-btn green" onClick={() => abrirWhatsApp(cliente)} disabled={Number(cliente.saldo_pendiente || 0) <= 0}>WhatsApp</button>}
                      <button type="button" className={`mini-btn ${cliente.activo === false ? "green" : "danger"}`} onClick={() => cambiarEstado(cliente)} disabled={guardando}>
                        {cliente.activo === false ? "Activar" : "Desactivar"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card card-pad" style={{ marginTop: 12 }}>
        <div className="section-heading section-heading-pedidos-unificados">
          <div>
            <h3>Movimientos de cartera</h3>
            <p className="muted small">Filtra por cliente, pedido, estado o rango de fechas. Incluye pedidos crédito, saldos actualizados y estados según abonos registrados.</p>
          </div>
          <strong className="muted small">{indicadores.movimientosFiltrados} movimiento(s)</strong>
        </div>

        <div className="cartera-filtros">
          <input value={filtros.texto} onChange={(e) => cambiarFiltro("texto", e.target.value)} placeholder="Buscar por pedido, cliente o concepto" />
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
        </div>

        <div className="pedidos-tabla-wrap" style={{ marginTop: 10 }}>
          <table className="pedidos-tabla-compacta">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Concepto</th>
                <th>Valor</th>
                <th>Saldo</th>
                <th>Estado</th>
                <th>Observación</th>
              </tr>
            </thead>
            <tbody>
              {movimientosFiltrados.length === 0 ? (
                <tr><td colSpan="8">{cargandoMovimientos ? "Cargando movimientos..." : "Sin movimientos para los filtros actuales."}</td></tr>
              ) : movimientosFiltrados.slice(0, 300).map((movimiento) => {
                const estado = estadoCartera(movimiento);
                return (
                  <tr key={movimiento.id} className={movimientoPendiente(movimiento) ? "" : "subtle-row"}>
                    <td>{formatearFechaHora(movimiento.fecha_movimiento || movimiento.created_at)}</td>
                    <td>#{movimiento.numero_pedido || "—"}</td>
                    <td>{movimiento.cliente_nombre || "—"}</td>
                    <td>{movimiento.concepto || "Pedido crédito"}</td>
                    <td className="td-total">{dinero(movimiento.valor)}</td>
                    <td className="td-total">{dinero(movimiento.saldo_movimiento)}</td>
                    <td><span className={`estado-movimiento ${estado}`}>{estado}</span></td>
                    <td className="td-obs">{movimiento.observaciones || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {movimientosFiltrados.length > 300 && <p className="muted small">Se muestran los primeros 300 movimientos. Usa filtros para acotar la búsqueda.</p>}
      </section>

      {clienteDetalle && (
        <div className="detalle-cartera">
          <div className="section-heading section-heading-pedidos-unificados">
            <div>
              <h3>Cartera de {clienteDetalle.nombre}</h3>
              <p className="muted small">Detalle del cliente según los filtros activos de movimientos.</p>
            </div>
            <div className="cartera-actions" style={{ marginTop: 0 }}>
              <button type="button" className="mini-btn green" style={{ width: "auto", marginBottom: 0 }} onClick={() => abrirAbono(clienteDetalle)} disabled={Number(clienteDetalle.saldo_pendiente || 0) <= 0}>Registrar abono</button>
              <button type="button" className="mini-btn" style={{ width: "auto", marginBottom: 0 }} onClick={() => setClienteDetalleId(null)}>Cerrar</button>
            </div>
          </div>

          <div className="cartera-indicadores" style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}>
            <div className="cartera-indicador"><small>Saldo actual cliente</small><strong>{dinero(clienteDetalle.saldo_pendiente)}</strong></div>
            <div className="cartera-indicador"><small>Saldo filtrado</small><strong>{dinero(resumenDetalle.saldo)}</strong></div>
            <div className="cartera-indicador neutral"><small>Total filtrado</small><strong>{dinero(resumenDetalle.total)}</strong></div>
            <div className="cartera-indicador neutral"><small>Abonado</small><strong>{dinero(resumenDetalle.abonado)}</strong></div>
            <div className="cartera-indicador neutral"><small>Pedidos pendientes</small><strong>{resumenDetalle.pendientes}</strong></div>
          </div>

          <div className="pedidos-tabla-wrap">
            <table className="pedidos-tabla-compacta">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Pedido</th>
                  <th>Concepto</th>
                  <th>Valor</th>
                  <th>Saldo</th>
                  <th>Estado</th>
                  <th>Observación</th>
                </tr>
              </thead>
              <tbody>
                {movimientosClienteDetalle.length === 0 ? (
                  <tr><td colSpan="7">Sin movimientos para este cliente con los filtros actuales.</td></tr>
                ) : movimientosClienteDetalle.map((movimiento) => {
                  const estado = estadoCartera(movimiento);
                  return (
                    <tr key={movimiento.id}>
                      <td>{formatearFechaHora(movimiento.fecha_movimiento || movimiento.created_at)}</td>
                      <td>#{movimiento.numero_pedido || "—"}</td>
                      <td>{movimiento.concepto || "Pedido crédito"}</td>
                      <td className="td-total">{dinero(movimiento.valor)}</td>
                      <td className="td-total">{dinero(movimiento.saldo_movimiento)}</td>
                      <td><span className={`estado-movimiento ${estado}`}>{estado}</span></td>
                      <td className="td-obs">{movimiento.observaciones || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="section-heading section-heading-pedidos-unificados" style={{ marginTop: 14 }}>
            <div>
              <h3>Historial de abonos</h3>
              <p className="muted small">Pagos registrados y aplicados a los pedidos de este cliente.</p>
            </div>
          </div>
          <div className="pedidos-tabla-wrap">
            <table className="pedidos-tabla-compacta">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Pedido aplicado</th>
                  <th>Valor abonado</th>
                  <th>Método</th>
                  <th>Saldo antes</th>
                  <th>Saldo después</th>
                  <th>Observación</th>
                </tr>
              </thead>
              <tbody>
                {abonosClienteDetalle.length === 0 ? (
                  <tr><td colSpan="7">Sin abonos registrados para este cliente.</td></tr>
                ) : abonosClienteDetalle.map((abono) => (
                  <tr key={abono.id} className="subtle-row">
                    <td>{formatearFechaHora(abono.fecha_abono || abono.created_at)}</td>
                    <td>#{abono.numero_pedido || "—"}</td>
                    <td className="td-total">{dinero(abono.valor_abono)}</td>
                    <td>{abono.metodo_pago || "—"}</td>
                    <td className="td-total">{dinero(abono.saldo_anterior)}</td>
                    <td className="td-total">{dinero(abono.saldo_nuevo)}</td>
                    <td className="td-obs">{abono.observacion || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
