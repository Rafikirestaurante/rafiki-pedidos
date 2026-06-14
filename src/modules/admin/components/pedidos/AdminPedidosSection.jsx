import React, { useCallback, useEffect, useMemo, useState } from "react";
import { dinero, formatearFechaHora, obtenerCliente, obtenerCodigoPedido, obtenerEstadoPedido } from "../../../../shared/utils/pedidos";
import AdminRealtimeStatus from "./AdminRealtimeStatus";
import AdminPedidosFiltros from "./AdminPedidosFiltros";
import AdminPedidoGrupo from "./AdminPedidoGrupo";
import { MESAS_DISPONIBLES } from "../../../../shared/utils/mesas";
import { PedidoCocina, TablaPedidosCompacta, resumirItemsPedidoCompacto } from "../../../pedidos/components/PedidosAdmin";
import { corregirClienteCreditoDePedido } from "../../../../services/carteraService";
import { listarClientesCreditoActivos } from "../../../../services/clientesCreditoService";


function normalizarMesaPedido(pedido) {
  const valor = String(pedido?.mesa || pedido?.ubicacion || "").trim().toUpperCase();
  return MESAS_DISPONIBLES.find((mesa) => valor === mesa || valor.includes(mesa)) || "";
}

function compararFechaPedidoDesc(a, b) {
  return new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime();
}

function ResumenMesasHoy({ pedidosActivos = [], cambiarEstadoPedido, guardandoEstadoPedidoId, puedeEditarPedido = false, onEditarPedido, editandoPedidoId }) {
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [mostrarTresPedidos, setMostrarTresPedidos] = useState(false);

  const pedidosPorMesa = useMemo(() => {
    const mapa = new Map(MESAS_DISPONIBLES.map((mesa) => [mesa, []]));

    pedidosActivos.forEach((pedido) => {
      const estado = obtenerEstadoPedido(pedido);
      if (estado === "Borrado") return;
      const mesa = normalizarMesaPedido(pedido);
      if (!mesa || !mapa.has(mesa)) return;
      mapa.get(mesa).push(pedido);
    });

    MESAS_DISPONIBLES.forEach((mesa) => {
      mapa.set(mesa, mapa.get(mesa).slice().sort(compararFechaPedidoDesc));
    });

    return mapa;
  }, [pedidosActivos]);

  const pedidosMesaSeleccionada = mesaSeleccionada ? pedidosPorMesa.get(mesaSeleccionada) || [] : [];
  const totalMesaSeleccionada = pedidosMesaSeleccionada.reduce((total, pedido) => total + Number(pedido?.total || 0), 0);

  return (
    <div className="admin-mesas-hoy-card">
      <div className="step-title admin-mesas-hoy-title">
        <span className="step-number">3</span>
        <div>
          <h4>Mesas y últimos pedidos</h4>
          <p className="muted small">Vista rápida por mesa, similar al paso de datos de entrega.</p>
        </div>
        <button
          type="button"
          className="button light admin-mesas-toggle"
          onClick={() => setMostrarTresPedidos((actual) => !actual)}
        >
          {mostrarTresPedidos ? "Ver solo último" : "Mostrar últimos 3"}
        </button>
      </div>

      <div className="admin-mesas-grid" aria-label="Resumen de mesas del día">
        {MESAS_DISPONIBLES.map((mesa) => {
          const pedidosMesa = pedidosPorMesa.get(mesa) || [];
          const ultimosPedidos = pedidosMesa.slice(0, mostrarTresPedidos ? 3 : 1);
          return (
            <article key={mesa} className={`admin-mesa-card ${mesa === "5B" ? "mesa-sola" : ""} ${pedidosMesa.length > 0 ? "con-pedidos" : "sin-pedidos"}`}>
              <div className="admin-mesa-card-head">
                <strong>{mesa}</strong>
                <span>{pedidosMesa.length} pedido{pedidosMesa.length === 1 ? "" : "s"}</span>
              </div>

              {ultimosPedidos.length > 0 ? (
                <div className="admin-mesa-ultimos">
                  {ultimosPedidos.map((pedido) => (
                    <div key={pedido.id} className="admin-mesa-pedido-mini">
                      <div>
                        <strong>#{obtenerCodigoPedido(pedido)}</strong>
                        <span>{formatearFechaHora(pedido.created_at)}</span>
                      </div>
                      <p>{resumirItemsPedidoCompacto(pedido)}</p>
                      <b>{dinero(pedido.total)}</b>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="admin-mesa-vacia">Sin pedidos registrados hoy.</div>
              )}

              <button
                type="button"
                className="button light admin-mesa-ver"
                onClick={() => setMesaSeleccionada(mesa)}
                disabled={pedidosMesa.length === 0}
              >
                Ver pedido completo
              </button>

            </article>
          );
        })}
      </div>

      {mesaSeleccionada && (
        <div className="admin-mesa-modal-backdrop" role="dialog" aria-modal="true" aria-label={`Pedido completo mesa ${mesaSeleccionada}`}>
          <div className="admin-mesa-modal">
            <div className="admin-mesa-modal-head">
              <div>
                <span>Mesa</span>
                <h3>{mesaSeleccionada}</h3>
                <p>{pedidosMesaSeleccionada.length} pedido{pedidosMesaSeleccionada.length === 1 ? "" : "s"} · Total {dinero(totalMesaSeleccionada)}</p>
              </div>
              <button type="button" className="button light" onClick={() => setMesaSeleccionada(null)}>
                Cerrar
              </button>
            </div>

            <div className="admin-mesa-modal-body">
              {pedidosMesaSeleccionada.map((pedido) => (
                <PedidoCocina
                  key={pedido.id}
                  pedido={pedido}
                  onCambiarEstado={cambiarEstadoPedido}
                  guardandoEstado={guardandoEstadoPedidoId === pedido.id}
                  puedeEditarPedido={puedeEditarPedido}
                  onEditarPedido={onEditarPedido}
                  editandoPedido={editandoPedidoId === pedido.id}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditarPedidoModal({ pedido, onCerrar, onGuardar, guardando = false }) {
  const [form, setForm] = useState(() => ({
    cliente: pedido?.cliente || pedido?.cliente_nombre || "",
    telefono: pedido?.telefono || "",
    ubicacion: pedido?.ubicacion || "",
    mesa: pedido?.mesa || "",
    mesero: pedido?.mesero || "",
    tipo_pago: pedido?.tipo_pago || "Efectivo",
    observaciones: pedido?.observaciones || "",
    pedido_texto: pedido?.pedido_texto || "",
    total: Number(pedido?.total || 0),
  }));

  const cambiarCampo = (campo) => (event) => {
    const valor = campo === "total" ? event.target.value : event.target.value;
    setForm((actual) => ({ ...actual, [campo]: valor }));
  };

  const guardar = async (event) => {
    event.preventDefault();
    const ok = await onGuardar?.(pedido.id, { ...form, total: Number(form.total || 0) });
    if (ok) onCerrar?.();
  };

  return (
    <div className="admin-mesa-modal-backdrop" role="dialog" aria-modal="true" aria-label={`Editar pedido ${obtenerCodigoPedido(pedido)}`}>
      <form className="admin-mesa-modal editar-pedido-modal" onSubmit={guardar}>
        <div className="admin-mesa-modal-head">
          <div>
            <span>Editar pedido</span>
            <h3>#{obtenerCodigoPedido(pedido)}</h3>
            <p>Solo rol administrador. Los cambios quedan en auditoría.</p>
          </div>
          <button type="button" className="button light" onClick={onCerrar} disabled={guardando}>Cerrar</button>
        </div>

        <div className="admin-mesa-modal-body editar-pedido-form">
          <label>
            Cliente / mesa
            <input value={form.cliente} onChange={cambiarCampo("cliente")} required />
          </label>
          <label>
            Teléfono
            <input value={form.telefono} onChange={cambiarCampo("telefono")} />
          </label>
          <label>
            Ubicación
            <input value={form.ubicacion} onChange={cambiarCampo("ubicacion")} />
          </label>
          <label>
            Mesa
            <select value={form.mesa} onChange={cambiarCampo("mesa")}>
              <option value="">Sin mesa</option>
              {MESAS_DISPONIBLES.map((mesa) => <option key={mesa} value={mesa}>{mesa}</option>)}
              <option value="Llevar">Llevar</option>
            </select>
          </label>
          <label>
            Mesero
            <input value={form.mesero} onChange={cambiarCampo("mesero")} />
          </label>
          <label>
            Método de pago
            <select value={form.tipo_pago} onChange={cambiarCampo("tipo_pago")}>
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Datafono">Datafono</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Crédito">Crédito</option>
            </select>
          </label>
          <label>
            Total
            <input type="number" min="0" step="100" value={form.total} onChange={cambiarCampo("total")} required />
          </label>
          <label className="editar-pedido-form-full">
            Observaciones
            <textarea rows="3" value={form.observaciones} onChange={cambiarCampo("observaciones")} />
          </label>
          <label className="editar-pedido-form-full">
            Detalle manual del pedido
            <textarea rows="5" value={form.pedido_texto} onChange={cambiarCampo("pedido_texto")} placeholder="Opcional. Útil para correcciones rápidas cuando el pedido no tiene items estructurados." />
          </label>
        </div>

        <div className="editar-pedido-actions">
          <button type="button" className="button light" onClick={onCerrar} disabled={guardando}>Cancelar</button>
          <button type="submit" className="button green" disabled={guardando}>{guardando ? "Guardando..." : "Guardar cambios"}</button>
        </div>
      </form>
    </div>
  );
}

function CorregirClienteCreditoModal({ pedido, onCerrar, onGuardar, onRetirar, guardando = false, mensaje = "" }) {
  const [nombre, setNombre] = useState(() => pedido?.cliente_nombre || pedido?.cliente || "");
  const [clientesCredito, setClientesCredito] = useState([]);
  const [cargandoClientes, setCargandoClientes] = useState(false);
  const [formaPagoRetiro, setFormaPagoRetiro] = useState("Efectivo");
  const pedidoEsCredito = String(pedido?.tipo_pago || "").trim().toLowerCase().replace("é", "e") === "credito";

  useEffect(() => {
    let activo = true;

    async function cargarClientesCredito() {
      setCargandoClientes(true);
      try {
        const lista = await listarClientesCreditoActivos();
        if (!activo) return;
        setClientesCredito(Array.isArray(lista) ? lista : []);
      } catch (error) {
        console.warn("No se pudieron cargar clientes crédito para Pedidos Hoy:", error?.message || error);
      } finally {
        if (activo) setCargandoClientes(false);
      }
    }

    cargarClientesCredito();
    return () => {
      activo = false;
    };
  }, []);

  const clientesOrdenados = useMemo(() => {
    return clientesCredito
      .map((cliente) => cliente?.nombre)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
  }, [clientesCredito]);

  const guardar = async (event) => {
    event.preventDefault();
    const ok = await onGuardar?.(pedido, nombre);
    if (ok) onCerrar?.();
  };

  const retirar = async () => {
    const ok = await onRetirar?.(pedido, formaPagoRetiro);
    if (ok) onCerrar?.();
  };

  return (
    <div className="admin-mesa-modal-backdrop" role="dialog" aria-modal="true" aria-label={`Clasificar pedido ${obtenerCodigoPedido(pedido)} como crédito`}>
      <form className="admin-mesa-modal editar-pedido-modal" onSubmit={guardar}>
        <div className="admin-mesa-modal-head">
          <div>
            <span>{pedidoEsCredito ? "Gestionar crédito" : "Clasificar como crédito"}</span>
            <h3>Pedido #{obtenerCodigoPedido(pedido)}</h3>
            <p>{pedidoEsCredito ? "Puedes corregir el cliente crédito o retirar este pedido de cartera si realmente fue pagado por otro medio." : "Esta acción cambia el pedido a Crédito, ajusta el nombre del cliente y registra la cuenta por cobrar."}</p>
          </div>
          <button type="button" className="button light" onClick={onCerrar} disabled={guardando}>Cerrar</button>
        </div>

        <div className="admin-mesa-modal-body editar-pedido-form">
          <label className="editar-pedido-form-full">
            Cliente crédito existente
            <select
              value={clientesOrdenados.includes(nombre) ? nombre : ""}
              onChange={(event) => event.target.value && setNombre(event.target.value)}
              disabled={guardando || cargandoClientes}
            >
              <option value="">{cargandoClientes ? "Cargando clientes..." : "Seleccionar de la lista"}</option>
              {clientesOrdenados.map((cliente) => (
                <option key={cliente} value={cliente}>{cliente}</option>
              ))}
            </select>
          </label>
          <label className="editar-pedido-form-full">
            Nombre del cliente
            <input
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Escribe o corrige el nombre del cliente"
              list="clientes-credito-pedidos-hoy"
              required
              autoFocus
            />
            <datalist id="clientes-credito-pedidos-hoy">
              {clientesOrdenados.map((cliente) => (
                <option key={cliente} value={cliente} />
              ))}
            </datalist>
            <small className="muted">Puedes escoger un cliente fijo o escribir un nuevo nombre para crearlo en Clientes Crédito.</small>
          </label>
          <div className="editar-pedido-form-full cartera-correccion-resumen">
            <strong>Valor a cartera:</strong> {dinero(pedido?.total || 0)} · <strong>Pago actual:</strong> {pedido?.tipo_pago || "—"}
          </div>

          {pedidoEsCredito ? (
            <div className="editar-pedido-form-full cartera-retiro-credito-box">
              <h4>¿Este pedido no era crédito?</h4>
              <p className="muted small">Retíralo de cartera y cambia la forma de pago real. El pedido no se borra; solo se anula el movimiento de cartera y se recalcula el saldo del cliente.</p>
              <label>
                Forma de pago real
                <select value={formaPagoRetiro} onChange={(event) => setFormaPagoRetiro(event.target.value)} disabled={guardando}>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Datafono">Datafono</option>
                  <option value="Nequi">Nequi</option>
                  <option value="Bancolombia">Bancolombia</option>
                  <option value="Otro">Otro</option>
                </select>
              </label>
              <button type="button" className="button danger" onClick={retirar} disabled={guardando}>
                {guardando ? "Guardando..." : "Quitar de crédito"}
              </button>
            </div>
          ) : null}

          {mensaje ? <div className="alert alert-warning editar-pedido-form-full">{mensaje}</div> : null}
        </div>

        <div className="editar-pedido-actions">
          <button type="button" className="button light" onClick={onCerrar} disabled={guardando}>Cancelar</button>
          <button type="submit" className="button green" disabled={guardando}>{guardando ? "Guardando..." : pedidoEsCredito ? "Actualizar cliente crédito" : "Pasar a crédito"}</button>
        </div>
      </form>
    </div>
  );
}

function AdminPedidosSectionBase({
  tituloPedidos,
  setRecargaPedidos,
  alertaPedidoNuevo,
  setAlertaPedidoNuevo,
  estadoRealtimePedidos,
  realtimeAdminActivo = true,
  cambiarEstadoRealtimeAdmin,
  filtroPedidos,
  setFiltroPedidos,
  fechaSeleccionada,
  setFechaSeleccionada,
  fechaInicioRangoPedidos,
  setFechaInicioRangoPedidos,
  fechaFinRangoPedidos,
  setFechaFinRangoPedidos,
  hayBusquedaPedidos,
  setBusqueda,
  busqueda,
  busquedaNumeroPedido = "",
  setBusquedaNumeroPedido,
  buscarPedidoPorNumeroGlobal,
  limpiarBusquedaNumeroPedido,
  resultadoNumeroPedido = [],
  cargandoNumeroPedido = false,
  errorNumeroPedido = "",
  cargandoPedidos = false,
  errorCargaPedidos = "",
  paginacionPedidos = {},
  cargarMasPedidos,
  pedidosFiltrados,
  pedidos,
  pedidosBorrados,
  pedidosPendientes,
  puedeFinalizarPendientes,
  finalizarTodosPendientes,
  finalizandoPendientes,
  cambiarEstadoPedido,
  guardandoEstadoPedidoId,
  puedeEliminarPedido,
  eliminarPedidoAdministrador,
  eliminandoPedidoId,
  puedeEditarPedido = false,
  editarPedidoAdministrador,
  onEditarPedidoEnMesas,
  editandoPedidoId,
  pedidosFinalizados,
  consolidado,
  pedidosActivos,
}) {
  const [pedidoEditando, setPedidoEditando] = useState(null);
  const [pedidoCorrigiendoCliente, setPedidoCorrigiendoCliente] = useState(null);
  const [guardandoCorreccionClienteId, setGuardandoCorreccionClienteId] = useState(null);
  const [mensajeCorreccionCliente, setMensajeCorreccionCliente] = useState("");
  const [ordenPedidosHoy, setOrdenPedidosHoy] = useState("ultimos");
  const totalPedidosServidor = Number.isFinite(paginacionPedidos?.total) ? paginacionPedidos.total : null;
  const hayMasPedidos = Boolean(paginacionPedidos?.hayMas);
  const cargandoMasPedidos = Boolean(paginacionPedidos?.cargandoMas);
  const totalCargadosServidor = Number.isFinite(paginacionPedidos?.cargados)
    ? paginacionPedidos.cargados
    : pedidos.length;

  const pedidosUnificados = useMemo(() => {
    const lista = Array.isArray(pedidosActivos) ? pedidosActivos.slice() : [];
    return lista.sort((a, b) => {
      const fechaA = new Date(a?.created_at || 0).getTime();
      const fechaB = new Date(b?.created_at || 0).getTime();
      return ordenPedidosHoy === "primeros" ? fechaA - fechaB : fechaB - fechaA;
    });
  }, [pedidosActivos, ordenPedidosHoy]);

  const abrirEditorPedido = useCallback((pedido) => {
    if (onEditarPedidoEnMesas) {
      onEditarPedidoEnMesas(pedido);
      return;
    }

    setPedidoEditando(pedido);
  }, [onEditarPedidoEnMesas]);


  const abrirCorreccionClienteCredito = useCallback((pedido) => {
    setMensajeCorreccionCliente("");
    setPedidoCorrigiendoCliente(pedido);
  }, []);

  const guardarCorreccionClienteCredito = useCallback(async (pedido, nombreDestino) => {
    const nombreLimpio = String(nombreDestino || "").trim().replace(/\s+/g, " ");
    if (!pedido?.id || !nombreLimpio) {
      setMensajeCorreccionCliente("Escribe el nombre correcto del cliente crédito.");
      return false;
    }

    setGuardandoCorreccionClienteId(pedido.id);
    setMensajeCorreccionCliente("");

    try {
      const pedidoActualizado = {
        ...pedido,
        cliente: nombreLimpio,
        cliente_nombre: nombreLimpio,
        tipo_pago: "Crédito",
      };

      const okPedido = await editarPedidoAdministrador?.(pedido.id, pedidoActualizado);
      if (!okPedido) return false;

      await corregirClienteCreditoDePedido(pedidoActualizado, nombreLimpio);
      setRecargaPedidos((actual) => actual + 1);
      return true;
    } catch (error) {
      setMensajeCorreccionCliente(error?.message || "No se pudo clasificar el pedido como crédito.");
      return false;
    } finally {
      setGuardandoCorreccionClienteId(null);
    }
  }, [editarPedidoAdministrador, setRecargaPedidos]);

  const retirarPedidoDeCredito = useCallback(async (pedido, nuevoTipoPago = "Efectivo") => {
    if (!pedido?.id) {
      setMensajeCorreccionCliente("No se pudo identificar el pedido.");
      return false;
    }

    const pagoReal = String(nuevoTipoPago || "Efectivo").trim() || "Efectivo";
    if (pagoReal.toLowerCase().replace("é", "e") === "credito") {
      setMensajeCorreccionCliente("Selecciona una forma de pago diferente a Crédito.");
      return false;
    }

    setGuardandoCorreccionClienteId(pedido.id);
    setMensajeCorreccionCliente("");

    try {
      const pedidoActualizado = {
        ...pedido,
        tipo_pago: pagoReal,
      };

      const okPedido = await editarPedidoAdministrador?.(pedido.id, pedidoActualizado);
      if (!okPedido) return false;

      setRecargaPedidos((actual) => actual + 1);
      return true;
    } catch (error) {
      setMensajeCorreccionCliente(error?.message || "No se pudo retirar el pedido de crédito.");
      return false;
    } finally {
      setGuardandoCorreccionClienteId(null);
    }
  }, [editarPedidoAdministrador, setRecargaPedidos]);

  const refrescarPedidos = useCallback(() => {
    setRecargaPedidos((actual) => actual + 1);
  }, [setRecargaPedidos]);

  const cerrarAlertaPedidoNuevo = useCallback(() => {
    setAlertaPedidoNuevo(null);
  }, [setAlertaPedidoNuevo]);

  return (
    <section className="card card-pad">
      <div className="admin-top-row admin-top-row-compact">
        <div className="admin-title-compact">
          <h2>📋 {tituloPedidos}</h2>
          <p className="muted small">Preparación, seguimiento e historial.</p>
        </div>

        <div className="admin-actions-line">
          <AdminRealtimeStatus estadoRealtimePedidos={estadoRealtimePedidos} />

          <button
            type="button"
            className="button light admin-action-button"
            onClick={refrescarPedidos}
          >
            🔄 Actualizar datos
          </button>

          <button
            type="button"
            className={realtimeAdminActivo ? "button light realtime-toggle-on admin-action-button" : "button realtime-toggle-off admin-action-button"}
            onClick={cambiarEstadoRealtimeAdmin}
            title={realtimeAdminActivo ? "Desactivar actualizaciones en vivo" : "Activar actualizaciones en vivo"}
          >
            {realtimeAdminActivo ? "Realtime ON" : "Realtime OFF"}
          </button>
        </div>
      </div>

      {alertaPedidoNuevo && (
        <div className="alerta-pedido-nuevo">
          <div>
            <strong>🔔 Nuevo pedido #{obtenerCodigoPedido(alertaPedidoNuevo)}</strong>
            <span>{obtenerCliente(alertaPedidoNuevo)} · {dinero(alertaPedidoNuevo.total)}</span>
          </div>
          <button type="button" onClick={cerrarAlertaPedidoNuevo}>
            Cerrar
          </button>
        </div>
      )}

      <AdminPedidosFiltros
        filtroPedidos={filtroPedidos}
        setFiltroPedidos={setFiltroPedidos}
        fechaSeleccionada={fechaSeleccionada}
        setFechaSeleccionada={setFechaSeleccionada}
        fechaInicioRangoPedidos={fechaInicioRangoPedidos}
        setFechaInicioRangoPedidos={setFechaInicioRangoPedidos}
        fechaFinRangoPedidos={fechaFinRangoPedidos}
        setFechaFinRangoPedidos={setFechaFinRangoPedidos}
        hayBusquedaPedidos={hayBusquedaPedidos}
        setBusqueda={setBusqueda}
        busqueda={busqueda}
        busquedaNumeroPedido={busquedaNumeroPedido}
        setBusquedaNumeroPedido={setBusquedaNumeroPedido}
        buscarPedidoPorNumeroGlobal={buscarPedidoPorNumeroGlobal}
        limpiarBusquedaNumeroPedido={limpiarBusquedaNumeroPedido}
        cargandoNumeroPedido={cargandoNumeroPedido}
      />

      {(resultadoNumeroPedido.length > 0 || errorNumeroPedido) && (
        <div className="pedido-numero-global-resultados">
          <div className="section-heading section-heading-pedidos-unificados">
            <h3>🔎 Resultado por número de pedido</h3>
            <span>{resultadoNumeroPedido.length}</span>
          </div>
          {errorNumeroPedido && resultadoNumeroPedido.length === 0 ? (
            <div className="alert alert-warning">{errorNumeroPedido}</div>
          ) : (
            <TablaPedidosCompacta
              pedidos={resultadoNumeroPedido}
              onCambiarEstado={cambiarEstadoPedido}
              guardandoEstadoPedidoId={guardandoEstadoPedidoId}
              onEliminarPedido={puedeEliminarPedido ? eliminarPedidoAdministrador : undefined}
              eliminandoPedidoId={eliminandoPedidoId}
              onEditarPedido={puedeEditarPedido ? abrirEditorPedido : undefined}
              editandoPedidoId={editandoPedidoId}
              onCorregirClienteCredito={puedeEditarPedido ? abrirCorreccionClienteCredito : undefined}
              corrigiendoClientePedidoId={guardandoCorreccionClienteId}
            />
          )}
        </div>
      )}

      {cargandoPedidos && (
        <div className="box soft admin-loading-state" role="status">
          Cargando pedidos... La última información visible se conserva mientras se actualiza.
        </div>
      )}

      {errorCargaPedidos && !cargandoPedidos && (
        <div className="alert alert-warning admin-fallback-state" role="alert">
          {errorCargaPedidos}
        </div>
      )}

      <div className="pedidos-carga-resumen" role="status">
        <p className="muted small">
          Mostrando {pedidosFiltrados.length} filtrado{pedidosFiltrados.length === 1 ? "" : "s"} de {pedidos.length} pedido{pedidos.length === 1 ? "" : "s"} cargado{pedidos.length === 1 ? "" : "s"}
          {totalPedidosServidor !== null ? ` · total del rango: ${totalPedidosServidor}` : ""}.
          {pedidosBorrados.length > 0 ? ` ${pedidosBorrados.length} en Pedidos Borrados no suman en ventas.` : ""}
        </p>
        {paginacionPedidos?.advertencia ? (
          <p className="muted small pedidos-carga-aviso">{paginacionPedidos.advertencia}</p>
        ) : null}
      </div>

      <ResumenMesasHoy
        pedidosActivos={pedidosActivos}
        cambiarEstadoPedido={cambiarEstadoPedido}
        guardandoEstadoPedidoId={guardandoEstadoPedidoId}
        puedeEditarPedido={puedeEditarPedido}
        onEditarPedido={abrirEditorPedido}
        editandoPedidoId={editandoPedidoId}
      />

      <div className="pedido-seccion">
        <div className="section-heading section-heading-pedidos-unificados">
          <h3>📋 Pedidos</h3>
          <div className="section-heading-actions pedidos-orden-actions">
            {pedidosPendientes.length > 0 && puedeFinalizarPendientes && (
              <button
                type="button"
                className="mini-btn green"
                onClick={finalizarTodosPendientes}
                disabled={finalizandoPendientes}
              >
                {finalizandoPendientes ? "Finalizando..." : "Finalizar todos"}
              </button>
            )}
            <button
              type="button"
              className={ordenPedidosHoy === "ultimos" ? "mini-btn active" : "mini-btn"}
              onClick={() => setOrdenPedidosHoy("ultimos")}
              title="Mostrar primero los últimos pedidos"
            >
              Últimos
            </button>
            <button
              type="button"
              className={ordenPedidosHoy === "primeros" ? "mini-btn active" : "mini-btn"}
              onClick={() => setOrdenPedidosHoy("primeros")}
              title="Mostrar desde el primer pedido del día"
            >
              Primeros
            </button>
            <span>{pedidosUnificados.length}</span>
          </div>
        </div>

        {pedidosUnificados.length === 0 ? (
          <div className="box soft">No hay pedidos registrados para esta vista.</div>
        ) : (
          <TablaPedidosCompacta
            pedidos={pedidosUnificados}
            onCambiarEstado={cambiarEstadoPedido}
            guardandoEstadoPedidoId={guardandoEstadoPedidoId}
            onEliminarPedido={puedeEliminarPedido ? eliminarPedidoAdministrador : undefined}
            eliminandoPedidoId={eliminandoPedidoId}
            onEditarPedido={puedeEditarPedido ? abrirEditorPedido : undefined}
            editandoPedidoId={editandoPedidoId}
            onCorregirClienteCredito={puedeEditarPedido ? abrirCorreccionClienteCredito : undefined}
            corrigiendoClientePedidoId={guardandoCorreccionClienteId}
          />
        )}
      </div>

      {hayMasPedidos && (
        <div className="pedidos-cargar-mas-box">
          <div>
            <strong>Carga optimizada activa</strong>
            <p className="muted small">
              Se cargaron {totalCargadosServidor} de {totalPedidosServidor || "más"} pedido{totalCargadosServidor === 1 ? "" : "s"}.
              Puedes traer más resultados sin bloquear el celular.
            </p>
          </div>
          <button
            type="button"
            className="button light"
            onClick={cargarMasPedidos}
            disabled={cargandoMasPedidos || cargandoPedidos}
          >
            {cargandoMasPedidos ? "Cargando más..." : "Cargar más resultados"}
          </button>
        </div>
      )}

      <AdminPedidoGrupo
        icono="🗑️"
        titulo="Pedidos Borrados"
        pedidos={pedidosBorrados}
        mensajeVacio="No hay pedidos borrados."
        danger
        cambiarEstadoPedido={cambiarEstadoPedido}
        guardandoEstadoPedidoId={guardandoEstadoPedidoId}
        eliminandoPedidoId={eliminandoPedidoId}
        puedeEditarPedido={puedeEditarPedido}
        onEditarPedido={abrirEditorPedido}
        editandoPedidoId={editandoPedidoId}
      />

      {pedidoEditando && (
        <EditarPedidoModal
          pedido={pedidoEditando}
          onCerrar={() => setPedidoEditando(null)}
          onGuardar={editarPedidoAdministrador}
          guardando={editandoPedidoId === pedidoEditando.id}
        />
      )}

      {pedidoCorrigiendoCliente && (
        <CorregirClienteCreditoModal
          pedido={pedidoCorrigiendoCliente}
          onCerrar={() => {
            setPedidoCorrigiendoCliente(null);
            setMensajeCorreccionCliente("");
          }}
          onGuardar={guardarCorreccionClienteCredito}
          onRetirar={retirarPedidoDeCredito}
          guardando={guardandoCorreccionClienteId === pedidoCorrigiendoCliente.id}
          mensaje={mensajeCorreccionCliente}
        />
      )}

    </section>
  );
}

export default React.memo(AdminPedidosSectionBase);
