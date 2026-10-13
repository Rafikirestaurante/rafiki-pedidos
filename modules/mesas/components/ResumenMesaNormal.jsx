import React from "react";
import ResumenPedidoItem from "../../../shared/components/ResumenPedidoItem";
import { dinero } from "../../../shared/utils/pedidos";
import DatosMesa from "./DatosMesa";

export default function ResumenMesaNormal({
  hayProductoSeleccionadoMesa,
  gruposResumenMesa,
  total,
  onAgregarAlmuerzo,
  onAgregarCafeteria,
  onQuitarGrupo,
  onCambiarCantidad,
  onEditarProteina,
  onEditarAcompanantes,
  onContinuar,
  onReiniciar,
  datosMesaProps
}) {
  return (
    <aside className="card card-pad fade-step" id="mesa-confirmacion-final">
      <h2>{hayProductoSeleccionadoMesa ? "Resumen del pedido" : "Resumen"}</h2>

      {!hayProductoSeleccionadoMesa ? (
        <div className="box soft">
          <strong>👈 Empieza seleccionando un almuerzo o un producto de cafetería</strong>
        </div>
      ) : (
        <>
          <p className="muted">Puedes combinar almuerzos, batidos, parfait, bebidas y cualquier producto de cafetería en una sola orden.</p>

          <div className="mesa-resumen-actions">
            <button type="button" onClick={onAgregarAlmuerzo} className="button add-meal">
              + Agregar almuerzo
            </button>
            <button type="button" onClick={onAgregarCafeteria} className="button cafeteria-action">
              ☕ Agregar cafetería
            </button>
          </div>

          <div className="box soft" style={{ marginBottom: 12 }}>
            <h3>Resumen del pedido</h3>
            {gruposResumenMesa.map((grupo) => (
              <ResumenPedidoItem
                key={grupo.key}
                grupo={grupo}
                className="mesas-resumen-item"
                onBorrar={onQuitarGrupo}
                onCambiarCantidad={onCambiarCantidad}
                onEditarProteina={onEditarProteina}
                onEditarAcompanantes={onEditarAcompanantes}
                mostrarTextoParaLlevar={false}
              />
            ))}
            <div className="total-row">
              <span>Total</span>
              <strong>{dinero(total)}</strong>
            </div>
          </div>

          <button
            type="button"
            onClick={onContinuar}
            className="button continue-button"
            style={{ marginTop: 8, background: "#16a34a" }}
          >
            continuar
          </button>

          <button type="button" onClick={onReiniciar} className="button light small-reset">
            Borrar y volver a empezar
          </button>

          <DatosMesa {...datosMesaProps} />
        </>
      )}
    </aside>
  );
}
