import React from "react";

function AdminConsolidadoResumenBase({ consolidado, pedidosActivos, pedidosFinalizados }) {
  return (
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
  );
}

export default React.memo(AdminConsolidadoResumenBase);
