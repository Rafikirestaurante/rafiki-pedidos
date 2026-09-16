import React, { useEffect, useMemo, useState } from "react";
import RafikiModal from "../../../shared/components/RafikiModal";
import { dinero } from "../../../shared/utils/pedidos";

function ListaAdicionales({ adicionales, cantidadPorNombre, onCambiarCantidad }) {
  return (
    <div className="mesa-adicionales-lista mesa-adicionales-lista-modal">
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
  );
}

function resumenSeleccionados(adicionales, cantidadPorNombre) {
  return adicionales.reduce((total, adicional) => total + Math.max(0, Number(cantidadPorNombre(adicional.nombre)) || 0), 0);
}

export function AdicionalesRestauranteMesas({
  adicionales,
  abierto,
  onAlternar,
  cantidadPorNombre,
  onCambiarCantidad,
}) {
  if (!Array.isArray(adicionales) || adicionales.length === 0) return null;

  const seleccionados = resumenSeleccionados(adicionales, cantidadPorNombre);

  return (
    <section className="mesa-adicionales-restaurante" aria-label="Adicionales del restaurante">
      <button
        type="button"
        className="mesa-adicionales-toggle"
        onClick={onAlternar}
        aria-expanded={Boolean(abierto)}
      >
        <span>🍟 Adicionales Restaurante</span>
        <span className="mesa-adicionales-modal-resumen">{seleccionados > 0 ? `${seleccionados} agregado${seleccionados === 1 ? "" : "s"}` : "Ver listado"} →</span>
      </button>

      <RafikiModal
        open={Boolean(abierto)}
        title="🍟 Adicionales Restaurante"
        description="Agrega o ajusta cantidades sin salir del pedido."
        onClose={onAlternar}
        size="md"
        className="mesa-adicionales-modal"
        footer={<button type="button" className="button green" onClick={onAlternar}>Listo</button>}
      >
        <ListaAdicionales
          adicionales={adicionales}
          cantidadPorNombre={cantidadPorNombre}
          onCambiarCantidad={onCambiarCantidad}
        />
      </RafikiModal>
    </section>
  );
}

export function AdicionalesCafeteriaMesas({
  adicionales,
  cantidadPorNombre,
  onCambiarCantidad,
  abrirAutomaticamente = true,
}) {
  const [abierto, setAbierto] = useState(false);
  const lista = Array.isArray(adicionales) ? adicionales : [];
  const seleccionados = useMemo(() => resumenSeleccionados(lista, cantidadPorNombre), [lista, cantidadPorNombre]);

  useEffect(() => {
    if (abrirAutomaticamente && lista.length > 0) setAbierto(true);
  }, [abrirAutomaticamente, lista.length]);

  return (
    <div className="cafeteria-panel fade-step mesa-adicionales-cafeteria-panel">
      <h3>Adicionales Cafetería</h3>
      <p className="muted small">Disponibles aunque el pedido no tenga otros productos de Cafetería.</p>
      {lista.length === 0 ? (
        <div className="box soft">No hay adicionales de Cafetería configurados. Agrégalos en Gerencia → Ajustes → Catálogo → Productos Cafetería usando la categoría “Adicionales cafetería”.</div>
      ) : (
        <button type="button" className="mesa-adicionales-cafeteria-trigger" onClick={() => setAbierto(true)}>
          <span>➕ Ver Adicionales Cafetería</span>
          <strong>{seleccionados > 0 ? `${seleccionados} agregado${seleccionados === 1 ? "" : "s"}` : `${lista.length} disponibles`}</strong>
        </button>
      )}

      <RafikiModal
        open={abierto}
        title="➕ Adicionales Cafetería"
        description="Selecciona los adicionales y sus cantidades."
        onClose={() => setAbierto(false)}
        size="md"
        className="mesa-adicionales-modal"
        footer={<button type="button" className="button green" onClick={() => setAbierto(false)}>Listo</button>}
      >
        <ListaAdicionales
          adicionales={lista}
          cantidadPorNombre={cantidadPorNombre}
          onCambiarCantidad={onCambiarCantidad}
        />
      </RafikiModal>
    </div>
  );
}
