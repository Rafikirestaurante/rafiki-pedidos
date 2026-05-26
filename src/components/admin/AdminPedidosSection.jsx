import React, { useCallback, useMemo, useState } from "react";
import { dinero, formatearFechaHora, obtenerCliente, obtenerCodigoPedido, obtenerEstadoPedido } from "../../utils/pedidos";
import AdminRealtimeStatus from "./AdminRealtimeStatus";
import AdminPedidosFiltros from "./AdminPedidosFiltros";
import AdminPedidoGrupo from "./AdminPedidoGrupo";
import AdminConsolidadoResumen from "./AdminConsolidadoResumen";
import { MESAS_DISPONIBLES } from "../../utils/mesas";
import { PedidoCocina, resumirItemsPedidoCompacto } from "../PedidosAdmin";


function normalizarMesaPedido(pedido) {
  const valor = String(pedido?.mesa || pedido?.ubicacion || "").trim().toUpperCase();
  return MESAS_DISPONIBLES.find((mesa) => valor === mesa || valor.includes(mesa)) || "";
}

function compararFechaPedidoDesc(a, b) {
  return new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime();
}

function ResumenMesasHoy({ pedidosActivos = [], cambiarEstadoPedido, guardandoEstadoPedidoId }) {
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
          const totalMesa = pedidosMesa.reduce((total, pedido) => total + Number(pedido?.total || 0), 0);

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

              {pedidosMesa.length > 0 && (
                <div className="admin-mesa-total">
                  <span>Total mesa</span>
                  <strong>{dinero(totalMesa)}</strong>
                </div>
              )}
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
                />
              ))}
            </div>
          </div>
        </div>
      )}
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
  pedidosFinalizados,
  consolidado,
  pedidosActivos,
}) {
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
      />

      <AdminPedidoGrupo
        icono="🟡"
        titulo="Pedidos pendientes"
        pedidos={pedidosPendientes}
        mensajeVacio="No hay pedidos pendientes."
        mostrarFinalizarTodos
        puedeFinalizarPendientes={puedeFinalizarPendientes}
        finalizarTodosPendientes={finalizarTodosPendientes}
        finalizandoPendientes={finalizandoPendientes}
        cambiarEstadoPedido={cambiarEstadoPedido}
        guardandoEstadoPedidoId={guardandoEstadoPedidoId}
        puedeEliminarPedido={puedeEliminarPedido}
        eliminarPedidoAdministrador={eliminarPedidoAdministrador}
        eliminandoPedidoId={eliminandoPedidoId}
      />

      <AdminPedidoGrupo
        icono="✅"
        titulo="Finalizados"
        pedidos={pedidosFinalizados}
        mensajeVacio="Todavía no hay pedidos finalizados."
        cambiarEstadoPedido={cambiarEstadoPedido}
        guardandoEstadoPedidoId={guardandoEstadoPedidoId}
        puedeEliminarPedido={puedeEliminarPedido}
        eliminarPedidoAdministrador={eliminarPedidoAdministrador}
        eliminandoPedidoId={eliminandoPedidoId}
      />

      <AdminPedidoGrupo
        icono="🗑️"
        titulo="Pedidos Borrados"
        pedidos={pedidosBorrados}
        mensajeVacio="No hay pedidos borrados."
        danger
        cambiarEstadoPedido={cambiarEstadoPedido}
        guardandoEstadoPedidoId={guardandoEstadoPedidoId}
        eliminandoPedidoId={eliminandoPedidoId}
      />

      <AdminConsolidadoResumen
        consolidado={consolidado}
        pedidosActivos={pedidosActivos}
        pedidosFinalizados={pedidosFinalizados}
      />
    </section>
  );
}

export default React.memo(AdminPedidosSectionBase);
