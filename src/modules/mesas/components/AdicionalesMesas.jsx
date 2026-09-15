import React from "react";
import { dinero } from "../../../shared/utils/pedidos";

export function AdicionalesRestauranteMesas({
  adicionales,
  abierto,
  onAlternar,
  cantidadPorNombre,
  onCambiarCantidad,
}) {
  if (!Array.isArray(adicionales) || adicionales.length === 0) return null;

  return (
    <section className="mesa-adicionales-restaurante" aria-label="Adicionales del restaurante">
      <button
        type="button"
        className="mesa-adicionales-toggle"
        onClick={onAlternar}
        aria-expanded={abierto}
        aria-controls="mesa-adicionales-restaurante-lista"
      >
        <span>🍟 Adicionales Restaurante</span>
        <span aria-hidden="true" className={`mesa-adicionales-chevron ${abierto ? "open" : ""}`}>⌄</span>
      </button>

      {abierto && (
        <div id="mesa-adicionales-restaurante-lista" className="mesa-adicionales-lista fade-step">
          {adicionales.map((adicional) => {
            const cantidad = cantidadPorNombre(adicional.nombre);
            return (
              <div key={adicional.nombre} className={`mesa-adicional-fila ${cantidad > 0 ? "selected" : ""}`}>
                <div className="mesa-adicional-info">
                  <strong>{adicional.nombre}</strong>
                  <span>{dinero(adicional.precio)} c/u</span>
                </div>
                {cantidad > 0 ? (
                  <div className="mesa-adicional-cantidad" aria-label={`Cantidad de ${adicional.nombre}`}>
                    <button type="button" onClick={() => onCambiarCantidad(adicional, cantidad - 1)} aria-label={`Restar ${adicional.nombre}`}>−</button>
                    <strong>{cantidad}</strong>
                    <button type="button" onClick={() => onCambiarCantidad(adicional, cantidad + 1)} aria-label={`Agregar otro ${adicional.nombre}`}>+</button>
                  </div>
                ) : (
                  <button type="button" className="mesa-adicional-agregar" onClick={() => onCambiarCantidad(adicional, 1)}>Agregar</button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function AdicionalesCafeteriaMesas({ adicionales, cantidadPorNombre, onCambiarCantidad }) {
  return (
    <div className="cafeteria-panel fade-step">
      <h3>Adicionales Cafetería</h3>
      <p className="muted small">Disponibles aunque el pedido no tenga otros productos de Cafetería.</p>
      {adicionales.length === 0 ? (
        <div className="box soft">No hay adicionales de Cafetería configurados. Agrégalos en Gerencia → Ajustes → Catálogo → Productos Cafetería usando la categoría “Adicionales cafetería”.</div>
      ) : (
        <div className="mesa-adicionales-lista">
          {adicionales.map((adicional) => {
            const cantidad = cantidadPorNombre(adicional.nombre);
            return (
              <div key={adicional.nombre} className={`mesa-adicional-fila ${cantidad > 0 ? "selected" : ""}`}>
                <div className="mesa-adicional-info"><strong>{adicional.nombre}</strong><span>{dinero(adicional.precio)} c/u</span></div>
                {cantidad > 0 ? (
                  <div className="mesa-adicional-cantidad">
                    <button type="button" onClick={() => onCambiarCantidad(adicional, cantidad - 1)}>−</button>
                    <strong>{cantidad}</strong>
                    <button type="button" onClick={() => onCambiarCantidad(adicional, cantidad + 1)}>+</button>
                  </div>
                ) : (
                  <button type="button" className="mesa-adicional-agregar" onClick={() => onCambiarCantidad(adicional, 1)}>Agregar</button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
