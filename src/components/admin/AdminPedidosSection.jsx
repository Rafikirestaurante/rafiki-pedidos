import React from "react";
import { CampoTexto } from "../common";
import { TablaPedidosCompacta } from "../PedidosAdmin";
import { dinero, fechaISOColombia, obtenerCliente, obtenerCodigoPedido } from "../../utils/pedidos";

export default function AdminPedidosSection({
  tituloPedidos,
  setRecargaPedidos,
  sonidoActivado,
  activarSonidoPedidos,
  alertaPedidoNuevo,
  setAlertaPedidoNuevo,
  filtroPedidos,
  setFiltroPedidos,
  fechaSeleccionada,
  setFechaSeleccionada,
  hayBusquedaPedidos,
  setBusqueda,
  busqueda,
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
  return (
    <section className="card card-pad">
      <div className="admin-top-row">
        <div>
          <h2>📋 {tituloPedidos}</h2>
          <p className="muted">Vista organizada para preparar pedidos y revisar historial.</p>
        </div>

        <div className="admin-actions-stack">
          <button
            type="button"
            className="button light"
            onClick={() => setRecargaPedidos((actual) => actual + 1)}
          >
            🔄 Actualizar pedidos
          </button>

          <button
            type="button"
            className={sonidoActivado ? "button green" : "button warning"}
            onClick={activarSonidoPedidos}
          >
            {sonidoActivado ? "🔔 Sonido activo" : "🔔 Activar sonido"}
          </button>
        </div>
      </div>

      {alertaPedidoNuevo && (
        <div className="alerta-pedido-nuevo">
          <div>
            <strong>🔔 Nuevo pedido #{obtenerCodigoPedido(alertaPedidoNuevo)}</strong>
            <span>{obtenerCliente(alertaPedidoNuevo)} · {dinero(alertaPedidoNuevo.total)}</span>
          </div>
          <button type="button" onClick={() => setAlertaPedidoNuevo(null)}>
            Cerrar
          </button>
        </div>
      )}

      <div className="filtros-historial">
        <button
          type="button"
          onClick={() => {
            setFiltroPedidos("hoy");
            setFechaSeleccionada(fechaISOColombia());
          }}
          className={filtroPedidos === "hoy" ? "active" : ""}
        >
          Hoy
        </button>

        <label className="calendario-filtro">
          <span>Buscar día</span>
          <input
            type="date"
            value={fechaSeleccionada}
            onChange={(e) => {
              setFechaSeleccionada(e.target.value);
              setFiltroPedidos("dia");
            }}
          />
        </label>

        {hayBusquedaPedidos && (
          <button type="button" onClick={() => setBusqueda("")}>
            Limpiar búsqueda
          </button>
        )}
      </div>

      <CampoTexto
        etiqueta="Buscar pedido"
        value={busqueda}
        onChange={setBusqueda}
        placeholder="Buscar por cliente, ubicación o pago..."
      />

      <p className="muted small">
        Mostrando {pedidosFiltrados.length} de {pedidos.length} pedidos cargados.
        {pedidosBorrados.length > 0 ? ` ${pedidosBorrados.length} en Pedidos Borrados no suman en ventas.` : ""}
      </p>

      <div className="pedido-seccion">
        <div className="section-heading">
          <h3>🟡 Pedidos pendientes</h3>
          <div className="section-heading-actions">
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
            <span>{pedidosPendientes.length}</span>
          </div>
        </div>

        {pedidosPendientes.length === 0 ? (
          <div className="box soft">No hay pedidos pendientes.</div>
        ) : (
          <TablaPedidosCompacta
            pedidos={pedidosPendientes}
            onCambiarEstado={cambiarEstadoPedido}
            guardandoEstadoPedidoId={guardandoEstadoPedidoId}
            onEliminarPedido={puedeEliminarPedido ? eliminarPedidoAdministrador : undefined}
            eliminandoPedidoId={eliminandoPedidoId}
          />
        )}
      </div>

      <div className="pedido-seccion">
        <div className="section-heading">
          <h3>✅ Finalizados</h3>
          <span>{pedidosFinalizados.length}</span>
        </div>

        {pedidosFinalizados.length === 0 ? (
          <div className="box soft">Todavía no hay pedidos finalizados.</div>
        ) : (
          <TablaPedidosCompacta
            pedidos={pedidosFinalizados}
            onCambiarEstado={cambiarEstadoPedido}
            guardandoEstadoPedidoId={guardandoEstadoPedidoId}
            onEliminarPedido={puedeEliminarPedido ? eliminarPedidoAdministrador : undefined}
            eliminandoPedidoId={eliminandoPedidoId}
          />
        )}
      </div>

      <div className="pedido-seccion">
        <div className="section-heading section-heading-danger">
          <h3>🗑️ Pedidos Borrados</h3>
          <span>{pedidosBorrados.length}</span>
        </div>

        {pedidosBorrados.length === 0 ? (
          <div className="box soft">No hay pedidos borrados.</div>
        ) : (
          <TablaPedidosCompacta
            pedidos={pedidosBorrados}
            onCambiarEstado={cambiarEstadoPedido}
            guardandoEstadoPedidoId={guardandoEstadoPedidoId}
            eliminandoPedidoId={eliminandoPedidoId}
          />
        )}
      </div>

      <div className="bottom-summary">
        <div className="card card-pad">
          <h3>Consolidado cocina</h3>
          <p className="muted">Resumen total de platos del día seleccionado.</p>

          {Object.keys(consolidado).length === 0 ? (
            <p className="muted">Todavía no hay productos para consolidar.</p>
          ) : (
            <div className="grid-2">
              {Object.entries(consolidado).map(([producto, cantidadProducto]) => (
                <div key={producto} className="box row">
                  <strong>{producto}</strong>
                  <strong>{cantidadProducto}</strong>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="summary-cards">
          <div className="summary-card">
            <span>Pedidos</span>
            <strong>{pedidosActivos.length}</strong>
          </div>

          <div className="summary-card">
            <span>Finalizados</span>
            <strong>{pedidosFinalizados.length}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
