import React, { useCallback } from "react";
import { dinero, obtenerCliente, obtenerCodigoPedido } from "../../utils/pedidos";
import AdminRealtimeStatus from "./AdminRealtimeStatus";
import AdminPedidosFiltros from "./AdminPedidosFiltros";
import AdminPedidoGrupo from "./AdminPedidoGrupo";
import AdminConsolidadoResumen from "./AdminConsolidadoResumen";

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
      <div className="admin-top-row">
        <div>
          <h2>📋 {tituloPedidos}</h2>
          <p className="muted">Vista organizada para preparar pedidos y revisar historial.</p>
        </div>

        <div className="admin-actions-stack">
          <AdminRealtimeStatus estadoRealtimePedidos={estadoRealtimePedidos} />

          <div className="admin-actions-stack horizontal">
            <button
              type="button"
              className="button light"
              onClick={refrescarPedidos}
            >
              🔄 Actualizar pedidos
            </button>

            <button
              type="button"
              className={realtimeAdminActivo ? "button light realtime-toggle-on" : "button realtime-toggle-off"}
              onClick={cambiarEstadoRealtimeAdmin}
              title={realtimeAdminActivo ? "Desactivar actualizaciones en vivo" : "Activar actualizaciones en vivo"}
            >
              {realtimeAdminActivo ? "🟢 Realtime ON" : "⚪ Realtime OFF"}
            </button>
          </div>
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
