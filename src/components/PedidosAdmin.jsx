import React from "react";
import {
  calcularTotalItem,
  crearLinkWhatsApp,
  crearMensajePedidoListo,
  crearTextoItem,
  dinero,
  formatearFechaHora,
  limpiarTelefonoWhatsApp,
  obtenerCodigoPedido,
  obtenerEstadoPedido,
  obtenerItemsPedido,
  imprimirTicketPedido
} from "../utils/pedidos";
import { EstadoBadge } from "./common";

export function PedidoCocina({ pedido, onCambiarEstado, guardandoEstado = false, revisado = true, onMarcarRevisado }) {
  const items = obtenerItemsPedido(pedido);
  const estadoNormalizado = obtenerEstadoPedido(pedido);
  const telefonoCliente = limpiarTelefonoWhatsApp(pedido.telefono);
  const mensajeCliente = crearMensajePedidoListo(pedido);
  const linkCliente = telefonoCliente ? crearLinkWhatsApp(telefonoCliente, mensajeCliente) : "#";

  return (
    <article className={`pedido-cocina ${estadoNormalizado === "Finalizado" ? "pedido-finalizado" : ""} ${!revisado ? "pedido-sin-revisar" : ""}`}>
      <div className={`pedido-header ${estadoNormalizado === "Finalizado" ? "pedido-header-finalizado" : "pedido-header-pending"}`}>
        <div className="pedido-header-title">
          Pedido #{obtenerCodigoPedido(pedido)}
        </div>
        <div className="pedido-header-right">
          {!revisado && <span className="badge badge-nuevo">Nuevo</span>}
          <EstadoBadge estado={pedido.estado} />
          <strong style={{ color: "white", fontSize: 20, fontFamily: "'Fraunces', serif" }}>{dinero(pedido.total)}</strong>
        </div>
      </div>

      <div className="pedido-body">
        <div className="pedido-top">
          <div>
            <p className="pedido-cliente-nombre">{obtenerCliente(pedido)}</p>
            <div className="pedido-meta">
              <span>🧾 Pedido N° {obtenerCodigoPedido(pedido)}</span>
              <span>🕒 {formatearFechaHora(pedido.created_at)}</span>
              <span>📍 {pedido.ubicacion || "Sin ubicación"}</span>
              <span>📞 {pedido.telefono || "Sin teléfono"}</span>
              <span>💳 {pedido.tipo_pago || "Pago no especificado"}</span>
            </div>
          </div>
        </div>

      <div className="items-cocina">
        {items.length === 0 ? (
          <div className="pedido-text">{pedido.pedido_texto}</div>
        ) : (
          items.map((item, index) => {
            const nombre = item.plato || item.proteina || "Plato";
            const precio = item.precioPlato || item.precioProteina || 0;
            const esSopa = esCategoriaSopa(item.categoria);

            return (
              <div key={item.id || index} className="item-cocina">
                <div className="item-numero">#{index + 1}</div>

                <div className="item-detalle">
                  <h4>
                    {item.cantidad} x {nombre}
                  </h4>

                  {item.categoria && (
                    <p>
                      <strong>Categoría:</strong> {item.categoria}
                    </p>
                  )}

                  <p>
                    <strong>Precio:</strong> {dinero(precio)}
                  </p>

                  {!esSopa && (
                    <p>
                      <strong>Acompañantes:</strong>{" "}
                      {Array.isArray(item.acompanantes) && item.acompanantes.length > 0
                        ? item.acompanantes.join(", ")
                        : "Sin acompañantes"}
                    </p>
                  )}

                  {!esSopa && item.observacionAcompanantes?.trim() && (
                    <p className="obs-acompanantes-admin">
                      <strong>Obs. acompañantes:</strong> {item.observacionAcompanantes.trim()}
                    </p>
                  )}

                  {esSopa && (
                    <p>
                      <strong>Acompañantes:</strong> No aplica para sopas
                    </p>
                  )}

                  {!esSopa && (
                    <p>
                      <strong>Incluye:</strong> Sopa + bebida
                    </p>
                  )}

                  <p>
                    <strong>Empaque:</strong> {textoParaLlevarItem(item)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {pedido.observaciones && (
        <div className="nota-cocina">
          <strong>Observaciones:</strong> {pedido.observaciones}
        </div>
      )}

      <div className="pedido-actions">
        <select
          value={estadoNormalizado}
          onChange={(e) => onCambiarEstado(pedido.id, e.target.value)}
          disabled={guardandoEstado}
        >
          {estadosPedido.map((estado) => (
            <option key={estado} value={estado}>
              {estado}
            </option>
          ))}
        </select>

        {!revisado && (
          <button
            type="button"
            className="button warning"
            onClick={() => onMarcarRevisado?.(pedido.id)}
          >
            Marcar revisado
          </button>
        )}

        {telefonoCliente ? (
          <a
            href={linkCliente}
            target="_blank"
            rel="noreferrer"
            className="button green link-button"
          >
            Avisar pedido listo
          </a>
        ) : (
          <button type="button" className="button light" disabled>
            Sin teléfono
          </button>
        )}
      </div>
      </div>
    </article>
  );
}



export function resumirItemsPedidoCompacto(pedido) {
  const items = obtenerItemsPedido(pedido);

  if (items.length === 0) {
    return pedido.pedido_texto || "Sin detalle";
  }

  return items.map((item) => {
    const nombre = item.plato || item.proteina || "Plato";
    const cantidad = item.cantidad || 1;
    const acomp = Array.isArray(item.acompanantes) && item.acompanantes.length > 0
      ? ` · ${item.acompanantes.join(", ")}`
      : "";
    const obsAcomp = item.observacionAcompanantes?.trim()
      ? ` · Obs: ${item.observacionAcompanantes.trim()}`
      : "";
    const empaque = textoParaLlevarItem(item) ? ` · ${textoParaLlevarItem(item)}` : "";
    return `${cantidad} x ${nombre}${acomp}${obsAcomp}${empaque}`;
  }).join(" | ");
}

export function TablaPedidosCompacta({ pedidos, onCambiarEstado, guardandoEstadoPedidoId, pedidosRevisados, onMarcarRevisado }) {
  const revisadosSet = new Set(pedidosRevisados.map(String));

  return (
    <div className="pedidos-tabla-wrap">
      <table className="pedidos-tabla-compacta">
        <thead>
          <tr>
            <th>N°</th>
            <th>Hora</th>
            <th>Cliente</th>
            <th>Pedido</th>
            <th>Obs.</th>
            <th>Pago</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((pedido) => {
            const estadoNormalizado = obtenerEstadoPedido(pedido);
            const revisado = revisadosSet.has(String(pedido.id));
            const telefonoCliente = limpiarTelefonoWhatsApp(pedido.telefono);
            const linkCliente = telefonoCliente
              ? crearLinkWhatsApp(telefonoCliente, crearMensajePedidoListo(pedido))
              : "#";

            return (
              <tr key={pedido.id} className={`${estadoNormalizado === "Finalizado" ? "fila-finalizada" : ""} ${!revisado ? "fila-nueva" : ""}`}>
                <td className="td-codigo">
                  <strong>#{obtenerCodigoPedido(pedido)}</strong>
                  {!revisado && <span>Nuevo</span>}
                </td>
                <td>{formatearFechaHora(pedido.created_at)}</td>
                <td>
                  <strong>{obtenerCliente(pedido)}</strong>
                  <small>{pedido.telefono || "Sin teléfono"}</small>
                  <small>{pedido.ubicacion || "Sin ubicación"}</small>
                </td>
                <td className="td-pedido">{resumirItemsPedidoCompacto(pedido)}</td>
                <td className="td-obs">{pedido.observaciones || "—"}</td>
                <td>{pedido.tipo_pago || "—"}</td>
                <td className="td-total">{dinero(pedido.total)}</td>
                <td>
                  <select
                    value={estadoNormalizado}
                    onChange={(e) => onCambiarEstado(pedido.id, e.target.value)}
                    disabled={guardandoEstadoPedidoId === pedido.id}
                  >
                    {estadosPedido.map((estado) => (
                      <option key={estado} value={estado}>{estado}</option>
                    ))}
                  </select>
                </td>
                <td className="td-acciones">
                  {!revisado && (
                    <button type="button" className="mini-btn warning" onClick={() => onMarcarRevisado?.(pedido.id)}>
                      Revisado
                    </button>
                  )}
                  <button type="button" className="mini-btn print" onClick={() => imprimirTicketPedido(pedido)}>
                    Imprimir
                  </button>
                  {telefonoCliente ? (
                    <a href={linkCliente} target="_blank" rel="noreferrer" className="mini-btn green">
                      WhatsApp
                    </a>
                  ) : (
                    <button type="button" className="mini-btn" disabled>Sin tel.</button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

