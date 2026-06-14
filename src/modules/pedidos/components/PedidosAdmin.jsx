import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  calcularTotalItem,
  crearLinkWhatsApp,
  crearMensajePedidoListo,
  crearTextoItem,
  dinero,
  esCategoriaSopa,
  textoParaLlevarItem,
  formatearFechaHora,
  limpiarTelefonoWhatsApp,
  obtenerCliente,
  obtenerCodigoPedido,
  obtenerEstadoPedido,
  obtenerItemsPedido,
  imprimirTicketPedido
} from "../../../shared/utils/pedidos";

function esItemCafeteria(item) {
  return item?.categoria === "cafeteria" || item?.area === "cafeteria";
}

function obtenerNombreItemCafeteria(item) {
  const tipo = item.tipo || "Producto cafetería";
  const producto = item.producto || item.nombre || item.plato || item.proteina || "";
  return producto ? `${tipo} — ${producto}` : tipo;
}

function obtenerPrecioUnitarioItem(item) {
  return Number(item.precioPlato || item.precioProteina || item.precio || 0);
}

function renderDetalleCafeteria(item) {
  const filas = [];

  if (item.base) filas.push(["Base", item.base]);
  if (item.tamano) filas.push(["Tamaño", item.tamano]);
  if (Array.isArray(item.frutas) && item.frutas.length > 0) filas.push(["Frutas", item.frutas.join(", ")]);
  if (Number(item.extraFrutas) > 0) filas.push(["Extra frutas", dinero(item.extraFrutas)]);
  if (item.acompanante) filas.push(["Acompañante", item.acompanante]);
  if (item.bebida) filas.push(["Bebida", item.bebida]);
  if (Array.isArray(item.adicionales) && item.adicionales.length > 0) {
    filas.push(["Adicionales", item.adicionales.map((x) => x.nombre || x).join(", ")]);
  }
  if (item.observacionesItem?.trim()) filas.push(["Obs.", item.observacionesItem.trim()]);

  return filas;
}

function PedidoCocinaBase({ pedido, onCambiarEstado, guardandoEstado = false, revisado = true, onMarcarRevisado, puedeEditarPedido = false, onEditarPedido, editandoPedido = false }) {
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
              {pedido.ubicacion ? <span>📍 {pedido.ubicacion}</span> : null}
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
            const itemEsCafeteria = esItemCafeteria(item);
            const nombre = itemEsCafeteria
              ? obtenerNombreItemCafeteria(item)
              : item.plato || item.proteina || "Plato";
            const precioUnitario = obtenerPrecioUnitarioItem(item);
            const totalItem = calcularTotalItem(item);
            const esSopa = esCategoriaSopa(item.categoria);
            const detallesCafeteria = itemEsCafeteria ? renderDetalleCafeteria(item) : [];

            return (
              <div key={item.id || index} className={`item-cocina ${itemEsCafeteria ? "item-cafeteria-admin" : ""}`}>
                <div className="item-numero">#{index + 1}</div>

                <div className="item-detalle">
                  <h4>
                    {item.cantidad || 1} x {nombre}
                  </h4>

                  {item.categoria && (
                    <p>
                      <strong>Categoría:</strong> {item.categoria}
                    </p>
                  )}

                  <p>
                    <strong>Precio:</strong> {dinero(precioUnitario)}
                    {Number(item.cantidad || 1) > 1 ? ` · Total item: ${dinero(totalItem)}` : ""}
                  </p>

                  {itemEsCafeteria ? (
                    <>
                      {detallesCafeteria.length > 0 ? (
                        detallesCafeteria.map(([etiqueta, valor]) => (
                          <p key={etiqueta}>
                            <strong>{etiqueta}:</strong> {valor}
                          </p>
                        ))
                      ) : (
                        <p>
                          <strong>Detalle:</strong> {crearTextoItem(item)}
                        </p>
                      )}

                      <p>
                        <strong>Empaque:</strong> {textoParaLlevarItem(item)}
                      </p>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
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
        {puedeEditarPedido && (
          <button
            type="button"
            className="button light"
            onClick={() => onEditarPedido?.(pedido)}
            disabled={editandoPedido}
          >
            {editandoPedido ? "Editando..." : "Editar"}
          </button>
        )}

        {estadoNormalizado !== "Finalizado" ? (
          <button
            type="button"
            className="button green"
            onClick={() => onCambiarEstado?.(pedido.id, "Finalizado")}
            disabled={guardandoEstado}
          >
            {guardandoEstado ? "Guardando..." : "Entregado"}
          </button>
        ) : (
          <span className="mini-estado-finalizado">Entregado</span>
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



function resumirItemCafeteriaCompacto(item) {
  const cantidad = Number(item.cantidad) || 1;
  const nombre = item.detalle_impresion || item.producto || item.nombre || item.plato || item.proteina || "Producto cafetería";
  const precio = obtenerPrecioUnitarioItem(item);
  const precioTexto = precio > 0 ? ` (${dinero(precio)})` : "";

  return `${cantidad} ${nombre}${precioTexto}`;
}

export function resumirItemsPedidoCompacto(pedido) {
  const items = obtenerItemsPedido(pedido);

  if (items.length === 0) {
    return pedido.pedido_texto || "Sin detalle";
  }

  return items.map((item) => {
    if (esItemCafeteria(item)) {
      return resumirItemCafeteriaCompacto(item);
    }

    const nombre = item.plato || item.proteina || "Plato";
    const cantidad = item.cantidad || 1;
    const acomp = Array.isArray(item.acompanantes) && item.acompanantes.length > 0
      ? ` · ${item.acompanantes.join(", ")}`
      : "";
    const adicionalesAlmuerzo = Array.isArray(item.adicionalesAlmuerzo) && item.adicionalesAlmuerzo.length > 0
      ? ` · Adicionales: ${item.adicionalesAlmuerzo.map((x) => `${x.nombre || x}${Number(x.precio || 0) ? ` ${dinero(x.precio)}` : ""}`).join(", ")}`
      : "";
    const obsAcomp = item.observacionAcompanantes?.trim()
      ? ` · Obs: ${item.observacionAcompanantes.trim()}`
      : "";
    const empaque = textoParaLlevarItem(item) ? ` · ${textoParaLlevarItem(item)}` : "";
    return `${cantidad} x ${nombre}${acomp}${adicionalesAlmuerzo}${obsAcomp}${empaque}`;
  }).join(" + ");
}

function esPagoCreditoPedido(pedido) {
  const pago = String(pedido?.tipo_pago || "").trim().toLowerCase();
  return pago === "credito" || pago === "crédito";
}

function TablaPedidosCompactaBase({ pedidos, onCambiarEstado, guardandoEstadoPedidoId, onEliminarPedido, eliminandoPedidoId, onEditarPedido, editandoPedidoId, onCorregirClienteCredito, corrigiendoClientePedidoId, pedidosPorPagina = 15 }) {
  const [paginaActual, setPaginaActual] = useState(1);
  const tablaRef = useRef(null);
  const totalPaginas = Math.max(1, Math.ceil((pedidos?.length || 0) / pedidosPorPagina));

  useEffect(() => {
    setPaginaActual(1);
  }, [pedidos]);

  useEffect(() => {
    if (paginaActual > totalPaginas) {
      setPaginaActual(totalPaginas);
    }
  }, [paginaActual, totalPaginas]);

  const pedidosPagina = useMemo(() => {
    const inicio = (paginaActual - 1) * pedidosPorPagina;
    return pedidos.slice(inicio, inicio + pedidosPorPagina);
  }, [pedidos, paginaActual, pedidosPorPagina]);

  const inicioVisible = pedidos.length === 0 ? 0 : (paginaActual - 1) * pedidosPorPagina + 1;
  const finVisible = Math.min(paginaActual * pedidosPorPagina, pedidos.length);

  const cambiarPaginaSinScroll = useCallback((calcularPagina) => {
    const posicionActual = typeof window !== "undefined" ? window.scrollY : 0;
    setPaginaActual((pagina) => {
      const siguientePagina = typeof calcularPagina === "function" ? calcularPagina(pagina) : calcularPagina;
      return Math.min(totalPaginas, Math.max(1, siguientePagina));
    });
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => window.scrollTo({ top: posicionActual, behavior: "auto" }));
    }
  }, [totalPaginas]);

  const irPaginaAnterior = useCallback(() => {
    cambiarPaginaSinScroll((pagina) => pagina - 1);
  }, [cambiarPaginaSinScroll]);

  const irPaginaSiguiente = useCallback(() => {
    cambiarPaginaSinScroll((pagina) => pagina + 1);
  }, [cambiarPaginaSinScroll]);

  const irPaginaFinal = useCallback(() => {
    cambiarPaginaSinScroll(totalPaginas);
  }, [cambiarPaginaSinScroll, totalPaginas]);

  return (
    <>
    <div className="pedidos-tabla-wrap" ref={tablaRef}>
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
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {pedidosPagina.map((pedido) => {
            const estadoNormalizado = obtenerEstadoPedido(pedido);
            const telefonoCliente = limpiarTelefonoWhatsApp(pedido.telefono);
            const linkCliente = telefonoCliente
              ? crearLinkWhatsApp(telefonoCliente, crearMensajePedidoListo(pedido))
              : "#";

            return (
              <tr key={pedido.id} className={estadoNormalizado === "Finalizado" ? "fila-finalizada" : estadoNormalizado === "Borrado" ? "fila-borrada" : ""}>
                <td className="td-codigo">
                  <strong>#{obtenerCodigoPedido(pedido)}</strong>
                </td>
                <td>{formatearFechaHora(pedido.created_at)}</td>
                <td>
                  <strong>{obtenerCliente(pedido)}</strong>
                  <small>{pedido.telefono || "Sin teléfono"}</small>
                  {pedido.ubicacion ? <small>{pedido.ubicacion}</small> : null}
                </td>
                <td className="td-pedido">{resumirItemsPedidoCompacto(pedido)}</td>
                <td className="td-obs">{pedido.observaciones || "—"}</td>
                <td>
                  <span className={esPagoCreditoPedido(pedido) ? "pago-badge pago-credito" : "pago-badge"}>
                    {pedido.tipo_pago || "—"}
                  </span>
                </td>
                <td className="td-total">{dinero(pedido.total)}</td>
                <td className="td-acciones">
                  {estadoNormalizado === "Borrado" ? (
                    <span className="mini-estado-borrado">Borrado</span>
                  ) : estadoNormalizado !== "Finalizado" ? (
                    <button
                      type="button"
                      className="mini-btn green"
                      onClick={() => onCambiarEstado?.(pedido.id, "Finalizado")}
                      disabled={guardandoEstadoPedidoId === pedido.id}
                    >
                      {guardandoEstadoPedidoId === pedido.id ? "Guardando..." : "Entregado"}
                    </button>
                  ) : (
                    <span className="mini-estado-finalizado">Entregado</span>
                  )}
                  {onEditarPedido && estadoNormalizado !== "Borrado" && (
                    <button
                      type="button"
                      className="mini-btn"
                      onClick={() => onEditarPedido?.(pedido)}
                      disabled={editandoPedidoId === pedido.id}
                    >
                      {editandoPedidoId === pedido.id ? "Editando..." : "Editar"}
                    </button>
                  )}
                  {onCorregirClienteCredito && esPagoCreditoPedido(pedido) && estadoNormalizado !== "Borrado" && (
                    <button
                      type="button"
                      className="mini-btn warning"
                      onClick={() => onCorregirClienteCredito?.(pedido)}
                      disabled={corrigiendoClientePedidoId === pedido.id}
                      title="Corregir nombre del cliente crédito y mover su cartera"
                    >
                      {corrigiendoClientePedidoId === pedido.id ? "Corrigiendo..." : "Cliente crédito"}
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
                  {estadoNormalizado !== "Borrado" && onEliminarPedido && (
                    <button
                      type="button"
                      className="mini-btn danger"
                      onClick={() => onEliminarPedido?.(pedido.id)}
                      disabled={eliminandoPedidoId === pedido.id}
                    >
                      {eliminandoPedidoId === pedido.id ? "Borrando..." : "Borrar"}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>

    {pedidos.length > pedidosPorPagina && (
      <div className="paginacion-pedidos">
        <span>
          Mostrando {inicioVisible}-{finVisible} de {pedidos.length}
        </span>
        <div className="paginacion-botones">
          <button
            type="button"
            className="mini-btn"
            onClick={irPaginaAnterior}
            disabled={paginaActual === 1}
          >
            ← Anterior
          </button>
          <strong>Página {paginaActual} de {totalPaginas}</strong>
          <button
            type="button"
            className="mini-btn"
            onClick={irPaginaSiguiente}
            disabled={paginaActual === totalPaginas}
          >
            Siguiente →
          </button>
          <button
            type="button"
            className="mini-btn"
            onClick={irPaginaFinal}
            disabled={paginaActual === totalPaginas}
            title="Ir a la última página"
          >
            Fin
          </button>
        </div>
      </div>
    )}
    </>
  );
}

export const PedidoCocina = React.memo(PedidoCocinaBase);
export const TablaPedidosCompacta = React.memo(TablaPedidosCompactaBase);
