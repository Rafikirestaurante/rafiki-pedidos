import React from "react";
import { obtenerCodigoPedido } from "../../utils/pedidos";

export default function ConfirmacionPedidoMesa({ pedido, modoLlevar, mesaLocal, onReiniciar }) {
  return (
    <main className="confirmacion-simple-mesa">
      <section className="card confirmacion-restaurante">
        <div className="hero green">
          <div className="confirmacion-check">✓</div>
          <h2>Pedido #{obtenerCodigoPedido(pedido)} enviado a cocina</h2>
          <p>El pedido fue registrado correctamente.</p>
        </div>
        <div className="card-pad" style={{ textAlign: "center" }}>
          <div className="confirmacion-ok">{modoLlevar ? "Llevar" : "Mesa"}: {pedido.mesa || pedido.cliente || mesaLocal}</div>
          <button type="button" onClick={onReiniciar} className="button green" style={{ width: "100%", maxWidth: 340 }}>
            Hacer otro pedido
          </button>
        </div>
      </section>
    </main>
  );
}
