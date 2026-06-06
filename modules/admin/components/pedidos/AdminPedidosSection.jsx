import React, { useCallback, useMemo, useState } from "react";
import { dinero, formatearFechaHora, obtenerCliente, obtenerCodigoPedido, obtenerEstadoPedido } from "../../../../utils/pedidos";
import AdminRealtimeStatus from "./AdminRealtimeStatus";
import AdminPedidosFiltros from "./AdminPedidosFiltros";
import AdminPedidoGrupo from "./AdminPedidoGrupo";
import { MESAS_DISPONIBLES } from "../../../../utils/mesas";
import { PedidoCocina, TablaPedidosCompacta, resumirItemsPedidoCompacto } from "../../../pedidos/components/PedidosAdmin";


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
              <option value="Tarjeta">Tarjeta</option>
              <option value="Pendiente">Pendiente</option>
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
  hayBusquedaPedidos,
  setBusqueda,
  busqueda,
  cargandoPedidos = false,
  errorCargaPedidos = "",
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
  editandoPedidoId,
  pedidosFinalizados,
  consolidado,
  pedidosActivos,
}) {
  const [pedidoEditando, setPedidoEditando] = useState(null);
  const [ordenPedidosHoy, setOrdenPedidosHoy] = useState("ultimos");

  const pedidosUnificados = useMemo(() => {
    const lista = Array.isArray(pedidosActivos) ? pedidosActivos.slice() : [];
    return lista.sort((a, b) => {
      const fechaA = new Date(a?.created_at || 0).getTime();
      const fechaB = new Date(b?.created_at || 0).getTime();
      return ordenPedidosHoy === "primeros" ? fechaA - fechaB : fechaB - fechaA;
    });
  }, [pedidosActivos, ordenPedidosHoy]);

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
        hayBusquedaPedidos={hayBusquedaPedidos}
        setBusqueda={setBusqueda}
        busqueda={busqueda}
      />

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

      <p className="muted small">
        Mostrando {pedidosFiltrados.length} de {pedidos.length} pedidos cargados.
        {pedidosBorrados.length > 0 ? ` ${pedidosBorrados.length} en Pedidos Borrados no suman en ventas.` : ""}
      </p>

      <ResumenMesasHoy
        pedidosActivos={pedidosActivos}
        cambiarEstadoPedido={cambiarEstadoPedido}
        guardandoEstadoPedidoId={guardandoEstadoPedidoId}
        puedeEditarPedido={puedeEditarPedido}
        onEditarPedido={setPedidoEditando}
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
            onEditarPedido={puedeEditarPedido ? setPedidoEditando : undefined}
            editandoPedidoId={editandoPedidoId}
          />
        )}
      </div>

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
        onEditarPedido={setPedidoEditando}
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

    </section>
  );
}

export default React.memo(AdminPedidosSectionBase);
