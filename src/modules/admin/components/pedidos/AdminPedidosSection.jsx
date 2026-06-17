import React, { useCallback, useEffect, useMemo, useState } from "react";
import { dinero, formatearFechaHora, normalizarTexto, obtenerCliente, obtenerCodigoPedido, obtenerEstadoPedido, obtenerItemsPedido } from "../../../../shared/utils/pedidos";
import AdminRealtimeStatus from "./AdminRealtimeStatus";
import AdminPedidosFiltros from "./AdminPedidosFiltros";
import AdminPedidoGrupo from "./AdminPedidoGrupo";
import { MESAS_DISPONIBLES } from "../../../../shared/utils/mesas";
import { PedidoCocina, TablaPedidosCompacta, resumirItemsPedidoCompacto } from "../../../pedidos/components/PedidosAdmin";
import { corregirClienteCreditoDePedido } from "../../../../services/carteraService";
import { listarClientesCreditoActivos } from "../../../../services/clientesCreditoService";
import RafikiEmptyState from "../../../../shared/components/RafikiEmptyState";
import RafikiTabs from "../../../../shared/components/RafikiTabs";


function normalizarMesaPedido(pedido) {
  const valor = String(pedido?.mesa || pedido?.ubicacion || "").trim().toUpperCase();
  return MESAS_DISPONIBLES.find((mesa) => valor === mesa || valor.includes(mesa)) || "";
}

function compararFechaPedidoDesc(a, b) {
  return new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime();
}


function formatearFechaCortaTicket(valor = new Date()) {
  const fecha = valor ? new Date(valor) : new Date();
  if (Number.isNaN(fecha.getTime())) return "--/--/--";

  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit"
  }).format(fecha).replace(/\//g, "-");
}

function escapeHtmlTicket(valor) {
  return String(valor || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function obtenerUbicacionTicketPedido(pedido) {
  return String(pedido?.ubicacion || pedido?.mesa || pedido?.cliente || "Sin ubicación").trim() || "Sin ubicación";
}

function itemEsCafeteriaPedidoHoy(item) {
  return item?.categoria === "cafeteria" || item?.area === "cafeteria";
}

function pedidoEsRestauranteParaLlevar(pedido) {
  const items = obtenerItemsPedido(pedido);

  if (items.length > 0) {
    return items.some((item) => Boolean(item?.paraLlevar) && !itemEsCafeteriaPedidoHoy(item));
  }

  const ubicacion = normalizarTexto([pedido?.ubicacion, pedido?.mesa, pedido?.tipo_pedido].filter(Boolean).join(" "));
  const texto = normalizarTexto([pedido?.pedido_texto, pedido?.cliente, pedido?.observaciones].filter(Boolean).join(" "));
  const pareceMesa = /\b[1-5][ab]\b/.test(ubicacion) || ubicacion.includes("comer en restaurante") || ubicacion.includes("mesa");
  const pareceRestaurante = ["almuerzo", "pechuga", "cerdo", "res", "posta", "sopa", "sancocho", "ajiaco", "plato"].some((palabra) => texto.includes(palabra));

  return !pareceMesa && pareceRestaurante;
}

function imprimirResumenRestauranteParaLlevar(pedidos = [], fechaReferencia = new Date()) {
  const lista = Array.isArray(pedidos) ? pedidos : [];
  const fechaTicket = formatearFechaCortaTicket(fechaReferencia || lista[0]?.created_at || new Date());
  const total = lista.reduce((suma, pedido) => suma + Number(pedido?.total || 0), 0);
  const filas = lista.map((pedido) => `
    <tr>
      <td class="numero">#${escapeHtmlTicket(obtenerCodigoPedido(pedido))}</td>
      <td>${escapeHtmlTicket(obtenerCliente(pedido))}</td>
      <td>${escapeHtmlTicket(obtenerUbicacionTicketPedido(pedido))}</td>
      <td class="total">${escapeHtmlTicket(dinero(pedido?.total || 0))}</td>
    </tr>
  `).join("");

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Pedidos para llevar ${fechaTicket}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          * { box-sizing: border-box; }
          body {
            width: 80mm;
            margin: 0;
            padding: 8px 6px 12px;
            background: #fff;
            color: #000;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10px;
          }
          .titulo {
            text-align: center;
            font-weight: 900;
            font-size: 14px;
            line-height: 1.15;
            margin-bottom: 2px;
            text-transform: uppercase;
          }
          .fecha {
            text-align: center;
            font-weight: 800;
            font-size: 12px;
            margin-bottom: 8px;
          }
          table { width: 100%; border-collapse: collapse; }
          th {
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 4px 2px;
            text-align: left;
            font-size: 9px;
            text-transform: uppercase;
          }
          td {
            border-bottom: 1px dashed #bbb;
            padding: 4px 2px;
            vertical-align: top;
            word-break: break-word;
          }
          .numero { width: 17mm; font-weight: 900; }
          .total { width: 18mm; text-align: right; font-weight: 900; white-space: nowrap; }
          .resumen {
            margin-top: 8px;
            padding-top: 6px;
            border-top: 1px dashed #000;
            font-size: 12px;
            font-weight: 900;
            display: flex;
            justify-content: space-between;
          }
          .vacio {
            text-align: center;
            font-weight: 800;
            padding: 12px 0;
          }
        </style>
      </head>
      <body>
        <div class="titulo">Pedidos para llevar</div>
        <div class="fecha">Fecha ${escapeHtmlTicket(fechaTicket)}</div>
        ${lista.length ? `
          <table>
            <thead>
              <tr>
                <th>N°</th>
                <th>Cliente</th>
                <th>Ubicación</th>
                <th class="total">Total</th>
              </tr>
            </thead>
            <tbody>${filas}</tbody>
          </table>
          <div class="resumen"><span>${lista.length} pedido${lista.length === 1 ? "" : "s"}</span><span>${escapeHtmlTicket(dinero(total))}</span></div>
        ` : `<div class="vacio">Sin pedidos restaurante para llevar.</div>`}
        <script>
          window.onload = function () {
            setTimeout(function () {
              window.print();
              window.close();
            }, 250);
          };
        </script>
      </body>
    </html>
  `;

  const ventana = window.open("", "_blank", "width=420,height=700");
  if (!ventana) return false;
  ventana.document.open();
  ventana.document.write(html);
  ventana.document.close();
  return true;
}

function ResumenMesasHoy({ pedidosActivos = [], cambiarEstadoPedido, guardandoEstadoPedidoId, puedeEditarPedido = false, onEditarPedido, editandoPedidoId }) {
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
                  puedeEditarPedido={puedeEditarPedido}
                  onEditarPedido={onEditarPedido}
                  editandoPedido={editandoPedidoId === pedido.id}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function formatearFechaInputPedido(valor) {
  const fecha = valor ? new Date(valor) : new Date();
  if (Number.isNaN(fecha.getTime())) return new Date().toISOString().slice(0, 10);
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatearHoraInputPedido(valor) {
  const fecha = valor ? new Date(valor) : new Date();
  if (Number.isNaN(fecha.getTime())) return "12:00";
  return `${String(fecha.getHours()).padStart(2, "0")}:${String(fecha.getMinutes()).padStart(2, "0")}`;
}

function CambiarFechaPedidoModal({ pedido, onCerrar, onGuardar, guardando = false }) {
  const [fecha, setFecha] = useState(() => formatearFechaInputPedido(pedido?.created_at));
  const [hora, setHora] = useState(() => formatearHoraInputPedido(pedido?.created_at));
  const [error, setError] = useState("");

  const guardar = async (event) => {
    event.preventDefault();
    setError("");

    if (!fecha || !hora) {
      setError("Selecciona la fecha y la hora del pedido.");
      return;
    }

    const fechaCompleta = new Date(`${fecha}T${hora}:00`);
    if (Number.isNaN(fechaCompleta.getTime())) {
      setError("La fecha seleccionada no es válida.");
      return;
    }

    const ok = await onGuardar?.(pedido, fechaCompleta.toISOString());
    if (ok) onCerrar?.();
  };

  return (
    <div className="admin-mesa-modal-backdrop" role="dialog" aria-modal="true" aria-label={`Cambiar fecha pedido ${obtenerCodigoPedido(pedido)}`}>
      <form className="admin-mesa-modal editar-pedido-modal" onSubmit={guardar}>
        <div className="admin-mesa-modal-head">
          <div>
            <span>Cambiar fecha</span>
            <h3>Pedido #{obtenerCodigoPedido(pedido)}</h3>
            <p>Solo administrador. El pedido se moverá al informe y caja de la fecha seleccionada.</p>
          </div>
          <button type="button" className="button light" onClick={onCerrar} disabled={guardando}>Cerrar</button>
        </div>

        <div className="admin-mesa-modal-body editar-pedido-form">
          <label>
            Fecha real del pedido
            <input type="date" value={fecha} onChange={(event) => setFecha(event.target.value)} required />
          </label>
          <label>
            Hora aproximada
            <input type="time" value={hora} onChange={(event) => setHora(event.target.value)} required />
          </label>
          <div className="editar-pedido-form-full box soft">
            <strong>Resumen</strong>
            <p className="muted small">#{obtenerCodigoPedido(pedido)} · {obtenerCliente(pedido)} · {dinero(pedido?.total || 0)}</p>
            <p className="muted small">Fecha actual: {formatearFechaHora(pedido?.created_at)}</p>
          </div>
          {error ? <div className="alert alert-warning editar-pedido-form-full">{error}</div> : null}
        </div>

        <div className="editar-pedido-actions">
          <button type="button" className="button light" onClick={onCerrar} disabled={guardando}>Cancelar</button>
          <button type="submit" className="button green" disabled={guardando}>{guardando ? "Guardando..." : "Cambiar fecha"}</button>
        </div>
      </form>
    </div>
  );
}

function EditarPedidoModal({ pedido, onCerrar, onGuardar, guardando = false }) {
  const [form, setForm] = useState(() => ({
    cliente: pedido?.cliente || pedido?.cliente_nombre || "",
    telefono: pedido?.telefono || "",
    ubicacion: pedido?.ubicacion || "",
    mesa: pedido?.mesa || "",
    mesero: pedido?.mesero || "",
    tipo_pago: pedido?.tipo_pago || "Efectivo",
    observaciones: pedido?.observaciones || "",
    pedido_texto: pedido?.pedido_texto || "",
    total: Number(pedido?.total || 0),
  }));

  const cambiarCampo = (campo) => (event) => {
    const valor = campo === "total" ? event.target.value : event.target.value;
    setForm((actual) => ({ ...actual, [campo]: valor }));
  };

  const guardar = async (event) => {
    event.preventDefault();
    const ok = await onGuardar?.(pedido.id, { ...form, total: Number(form.total || 0) });
    if (ok) onCerrar?.();
  };

  return (
    <div className="admin-mesa-modal-backdrop" role="dialog" aria-modal="true" aria-label={`Editar pedido ${obtenerCodigoPedido(pedido)}`}>
      <form className="admin-mesa-modal editar-pedido-modal" onSubmit={guardar}>
        <div className="admin-mesa-modal-head">
          <div>
            <span>Editar pedido</span>
            <h3>#{obtenerCodigoPedido(pedido)}</h3>
            <p>Solo rol administrador. Los cambios quedan en auditoría.</p>
          </div>
          <button type="button" className="button light" onClick={onCerrar} disabled={guardando}>Cerrar</button>
        </div>

        <div className="admin-mesa-modal-body editar-pedido-form">
          <label>
            Cliente / mesa
            <input value={form.cliente} onChange={cambiarCampo("cliente")} required />
          </label>
          <label>
            Teléfono
            <input value={form.telefono} onChange={cambiarCampo("telefono")} />
          </label>
          <label>
            Ubicación
            <input value={form.ubicacion} onChange={cambiarCampo("ubicacion")} />
          </label>
          <label>
            Mesa
            <select value={form.mesa} onChange={cambiarCampo("mesa")}>
              <option value="">Sin mesa</option>
              {MESAS_DISPONIBLES.map((mesa) => <option key={mesa} value={mesa}>{mesa}</option>)}
              <option value="Llevar">Llevar</option>
            </select>
          </label>
          <label>
            Mesero
            <input value={form.mesero} onChange={cambiarCampo("mesero")} />
          </label>
          <label>
            Método de pago
            <select value={form.tipo_pago} onChange={cambiarCampo("tipo_pago")}>
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Datafono">Datafono</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Crédito">Crédito</option>
            </select>
          </label>
          <label>
            Total
            <input type="number" min="0" step="100" value={form.total} onChange={cambiarCampo("total")} required />
          </label>
          <label className="editar-pedido-form-full">
            Observaciones
            <textarea rows="3" value={form.observaciones} onChange={cambiarCampo("observaciones")} />
          </label>
          <label className="editar-pedido-form-full">
            Detalle manual del pedido
            <textarea rows="5" value={form.pedido_texto} onChange={cambiarCampo("pedido_texto")} placeholder="Opcional. Útil para correcciones rápidas cuando el pedido no tiene items estructurados." />
          </label>
        </div>

        <div className="editar-pedido-actions">
          <button type="button" className="button light" onClick={onCerrar} disabled={guardando}>Cancelar</button>
          <button type="submit" className="button green" disabled={guardando}>{guardando ? "Guardando..." : "Guardar cambios"}</button>
        </div>
      </form>
    </div>
  );
}

function CorregirClienteCreditoModal({ pedido, onCerrar, onGuardar, onRetirar, guardando = false, mensaje = "" }) {
  const [nombre, setNombre] = useState(() => pedido?.cliente_nombre || pedido?.cliente || "");
  const [clientesCredito, setClientesCredito] = useState([]);
  const [cargandoClientes, setCargandoClientes] = useState(false);
  const [formaPagoRetiro, setFormaPagoRetiro] = useState("Efectivo");
  const pedidoEsCredito = String(pedido?.tipo_pago || "").trim().toLowerCase().replace("é", "e") === "credito";

  useEffect(() => {
    let activo = true;

    async function cargarClientesCredito() {
      setCargandoClientes(true);
      try {
        const lista = await listarClientesCreditoActivos();
        if (!activo) return;
        setClientesCredito(Array.isArray(lista) ? lista : []);
      } catch (error) {
        console.warn("No se pudieron cargar clientes crédito para Pedidos Hoy:", error?.message || error);
      } finally {
        if (activo) setCargandoClientes(false);
      }
    }

    cargarClientesCredito();
    return () => {
      activo = false;
    };
  }, []);

  const clientesOrdenados = useMemo(() => {
    return clientesCredito
      .map((cliente) => cliente?.nombre)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
  }, [clientesCredito]);

  const guardar = async (event) => {
    event.preventDefault();
    const ok = await onGuardar?.(pedido, nombre);
    if (ok) onCerrar?.();
  };

  const retirar = async () => {
    const ok = await onRetirar?.(pedido, formaPagoRetiro);
    if (ok) onCerrar?.();
  };

  return (
    <div className="admin-mesa-modal-backdrop" role="dialog" aria-modal="true" aria-label={`Clasificar pedido ${obtenerCodigoPedido(pedido)} como crédito`}>
      <form className="admin-mesa-modal editar-pedido-modal" onSubmit={guardar}>
        <div className="admin-mesa-modal-head">
          <div>
            <span>{pedidoEsCredito ? "Gestionar crédito" : "Clasificar como crédito"}</span>
            <h3>Pedido #{obtenerCodigoPedido(pedido)}</h3>
            <p>{pedidoEsCredito ? "Puedes corregir el cliente crédito o retirar este pedido de cartera si realmente fue pagado por otro medio." : "Esta acción cambia el pedido a Crédito, ajusta el nombre del cliente y registra la cuenta por cobrar."}</p>
          </div>
          <button type="button" className="button light" onClick={onCerrar} disabled={guardando}>Cerrar</button>
        </div>

        <div className="admin-mesa-modal-body editar-pedido-form">
          <label className="editar-pedido-form-full">
            Cliente crédito existente
            <select
              value={clientesOrdenados.includes(nombre) ? nombre : ""}
              onChange={(event) => event.target.value && setNombre(event.target.value)}
              disabled={guardando || cargandoClientes}
            >
              <option value="">{cargandoClientes ? "Cargando clientes..." : "Seleccionar de la lista"}</option>
              {clientesOrdenados.map((cliente) => (
                <option key={cliente} value={cliente}>{cliente}</option>
              ))}
            </select>
          </label>
          <label className="editar-pedido-form-full">
            Nombre del cliente
            <input
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Escribe o corrige el nombre del cliente"
              list="clientes-credito-pedidos-hoy"
              required
              autoFocus
            />
            <datalist id="clientes-credito-pedidos-hoy">
              {clientesOrdenados.map((cliente) => (
                <option key={cliente} value={cliente} />
              ))}
            </datalist>
            <small className="muted">Puedes escoger un cliente fijo o escribir un nuevo nombre para crearlo en Clientes Crédito.</small>
          </label>
          <div className="editar-pedido-form-full cartera-correccion-resumen">
            <strong>Valor a cartera:</strong> {dinero(pedido?.total || 0)} · <strong>Pago actual:</strong> {pedido?.tipo_pago || "—"}
          </div>

          {pedidoEsCredito ? (
            <div className="editar-pedido-form-full cartera-retiro-credito-box">
              <h4>¿Este pedido no era crédito?</h4>
              <p className="muted small">Retíralo de cartera y cambia la forma de pago real. El pedido no se borra; solo se anula el movimiento de cartera y se recalcula el saldo del cliente.</p>
              <label>
                Forma de pago real
                <select value={formaPagoRetiro} onChange={(event) => setFormaPagoRetiro(event.target.value)} disabled={guardando}>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Datafono">Datafono</option>
                  <option value="Nequi">Nequi</option>
                  <option value="Bancolombia">Bancolombia</option>
                  <option value="Otro">Otro</option>
                </select>
              </label>
              <button type="button" className="button danger" onClick={retirar} disabled={guardando}>
                {guardando ? "Guardando..." : "Quitar de crédito"}
              </button>
            </div>
          ) : null}

          {mensaje ? <div className="alert alert-warning editar-pedido-form-full">{mensaje}</div> : null}
        </div>

        <div className="editar-pedido-actions">
          <button type="button" className="button light" onClick={onCerrar} disabled={guardando}>Cancelar</button>
          <button type="submit" className="button green" disabled={guardando}>{guardando ? "Guardando..." : pedidoEsCredito ? "Actualizar cliente crédito" : "Pasar a crédito"}</button>
        </div>
      </form>
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
  fechaInicioRangoPedidos,
  setFechaInicioRangoPedidos,
  fechaFinRangoPedidos,
  setFechaFinRangoPedidos,
  hayBusquedaPedidos,
  setBusqueda,
  busqueda,
  busquedaNumeroPedido = "",
  setBusquedaNumeroPedido,
  buscarPedidoPorNumeroGlobal,
  limpiarBusquedaNumeroPedido,
  resultadoNumeroPedido = [],
  cargandoNumeroPedido = false,
  errorNumeroPedido = "",
  cargandoPedidos = false,
  errorCargaPedidos = "",
  paginacionPedidos = {},
  cargarMasPedidos,
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
  puedeEditarPedido = false,
  editarPedidoAdministrador,
  cambiarFechaPedidoAdministrador,
  onEditarPedidoEnMesas,
  editandoPedidoId,
  pedidosFinalizados,
  consolidado,
  pedidosActivos,
}) {
  const [pedidoEditando, setPedidoEditando] = useState(null);
  const [pedidoCambiandoFecha, setPedidoCambiandoFecha] = useState(null);
  const [pedidoCorrigiendoCliente, setPedidoCorrigiendoCliente] = useState(null);
  const [guardandoCorreccionClienteId, setGuardandoCorreccionClienteId] = useState(null);
  const [mensajeCorreccionCliente, setMensajeCorreccionCliente] = useState("");
  const [ordenPedidosHoy, setOrdenPedidosHoy] = useState("ultimos");
  const [vistaPedidosHoy, setVistaPedidosHoy] = useState("pedidos");
  const [filtroRestauranteParaLlevar, setFiltroRestauranteParaLlevar] = useState(false);
  const [mostrarFiltrosPedidos, setMostrarFiltrosPedidos] = useState(true);
  const totalPedidosServidor = Number.isFinite(paginacionPedidos?.total) ? paginacionPedidos.total : null;
  const hayMasPedidos = Boolean(paginacionPedidos?.hayMas);
  const cargandoMasPedidos = Boolean(paginacionPedidos?.cargandoMas);
  const totalCargadosServidor = Number.isFinite(paginacionPedidos?.cargados)
    ? paginacionPedidos.cargados
    : pedidos.length;
  const cantidadPedidosActivos = Array.isArray(pedidosActivos) ? pedidosActivos.length : 0;
  const cantidadPedidosBorrados = Array.isArray(pedidosBorrados) ? pedidosBorrados.length : 0;

  const pedidosUnificados = useMemo(() => {
    const lista = Array.isArray(pedidosActivos) ? pedidosActivos.slice() : [];
    return lista.sort((a, b) => {
      const fechaA = new Date(a?.created_at || 0).getTime();
      const fechaB = new Date(b?.created_at || 0).getTime();
      return ordenPedidosHoy === "primeros" ? fechaA - fechaB : fechaB - fechaA;
    });
  }, [pedidosActivos, ordenPedidosHoy]);

  const pedidosRestauranteParaLlevar = useMemo(
    () => pedidosUnificados.filter(pedidoEsRestauranteParaLlevar),
    [pedidosUnificados]
  );

  const pedidosVisiblesTabla = filtroRestauranteParaLlevar ? pedidosRestauranteParaLlevar : pedidosUnificados;

  const fechaReferenciaImpresion = useMemo(() => {
    if (filtroPedidos === "dia" && fechaSeleccionada) return new Date(`${fechaSeleccionada}T12:00:00-05:00`);
    if (filtroPedidos === "rango" && fechaInicioRangoPedidos) return new Date(`${fechaInicioRangoPedidos}T12:00:00-05:00`);
    return new Date();
  }, [fechaInicioRangoPedidos, fechaSeleccionada, filtroPedidos]);

  const tabsPedidosHoy = useMemo(() => ([
    { id: "pedidos", label: "Pedidos", icon: "📋", count: pedidosUnificados.length },
    { id: "mesas", label: "Mesas", icon: "🍽️", count: cantidadPedidosActivos },
    { id: "borrados", label: "Borrados", icon: "🗑️", count: cantidadPedidosBorrados },
  ]), [cantidadPedidosActivos, cantidadPedidosBorrados, pedidosUnificados.length]);

  const abrirEditorPedido = useCallback((pedido) => {
    if (onEditarPedidoEnMesas) {
      onEditarPedidoEnMesas(pedido);
      return;
    }

    setPedidoEditando(pedido);
  }, [onEditarPedidoEnMesas]);


  const abrirCambioFechaPedido = useCallback((pedido) => {
    setPedidoCambiandoFecha(pedido);
  }, []);


  const abrirCorreccionClienteCredito = useCallback((pedido) => {
    setMensajeCorreccionCliente("");
    setPedidoCorrigiendoCliente(pedido);
  }, []);

  const guardarCorreccionClienteCredito = useCallback(async (pedido, nombreDestino) => {
    const nombreLimpio = String(nombreDestino || "").trim().replace(/\s+/g, " ");
    if (!pedido?.id || !nombreLimpio) {
      setMensajeCorreccionCliente("Escribe el nombre correcto del cliente crédito.");
      return false;
    }

    setGuardandoCorreccionClienteId(pedido.id);
    setMensajeCorreccionCliente("");

    try {
      const pedidoActualizado = {
        ...pedido,
        cliente: nombreLimpio,
        cliente_nombre: nombreLimpio,
        tipo_pago: "Crédito",
      };

      const okPedido = await editarPedidoAdministrador?.(pedido.id, pedidoActualizado);
      if (!okPedido) return false;

      await corregirClienteCreditoDePedido(pedidoActualizado, nombreLimpio);
      setRecargaPedidos((actual) => actual + 1);
      return true;
    } catch (error) {
      setMensajeCorreccionCliente(error?.message || "No se pudo clasificar el pedido como crédito.");
      return false;
    } finally {
      setGuardandoCorreccionClienteId(null);
    }
  }, [editarPedidoAdministrador, setRecargaPedidos]);

  const retirarPedidoDeCredito = useCallback(async (pedido, nuevoTipoPago = "Efectivo") => {
    if (!pedido?.id) {
      setMensajeCorreccionCliente("No se pudo identificar el pedido.");
      return false;
    }

    const pagoReal = String(nuevoTipoPago || "Efectivo").trim() || "Efectivo";
    if (pagoReal.toLowerCase().replace("é", "e") === "credito") {
      setMensajeCorreccionCliente("Selecciona una forma de pago diferente a Crédito.");
      return false;
    }

    setGuardandoCorreccionClienteId(pedido.id);
    setMensajeCorreccionCliente("");

    try {
      const pedidoActualizado = {
        ...pedido,
        tipo_pago: pagoReal,
      };

      const okPedido = await editarPedidoAdministrador?.(pedido.id, pedidoActualizado);
      if (!okPedido) return false;

      setRecargaPedidos((actual) => actual + 1);
      return true;
    } catch (error) {
      setMensajeCorreccionCliente(error?.message || "No se pudo retirar el pedido de crédito.");
      return false;
    } finally {
      setGuardandoCorreccionClienteId(null);
    }
  }, [editarPedidoAdministrador, setRecargaPedidos]);

  const refrescarPedidos = useCallback(() => {
    setRecargaPedidos((actual) => actual + 1);
  }, [setRecargaPedidos]);

  const cerrarAlertaPedidoNuevo = useCallback(() => {
    setAlertaPedidoNuevo(null);
  }, [setAlertaPedidoNuevo]);

  const alternarFiltroRestauranteParaLlevar = useCallback(() => {
    setFiltroRestauranteParaLlevar((actual) => !actual);
    setVistaPedidosHoy("pedidos");
  }, []);

  const imprimirRestauranteParaLlevar = useCallback(() => {
    imprimirResumenRestauranteParaLlevar(pedidosRestauranteParaLlevar, fechaReferenciaImpresion);
  }, [fechaReferenciaImpresion, pedidosRestauranteParaLlevar]);

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
            onClick={() => setMostrarFiltrosPedidos((valor) => !valor)}
          >
            {mostrarFiltrosPedidos ? "Ocultar filtros" : "Mostrar filtros"}
          </button>

          <button
            type="button"
            className="button light admin-action-button"
            onClick={refrescarPedidos}
          >
            🔄 Actualizar datos
          </button>

          <button
            type="button"
            className={filtroRestauranteParaLlevar ? "button green admin-action-button" : "button light admin-action-button"}
            onClick={alternarFiltroRestauranteParaLlevar}
            title="Mostrar solo pedidos de restaurante marcados para llevar"
          >
            🥡 Restaurante para llevar
          </button>

          <button
            type="button"
            className="button light admin-action-button"
            onClick={imprimirRestauranteParaLlevar}
            title="Imprimir resumen 80mm de restaurante para llevar"
          >
            🧾 Imprimir 80mm
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

      {mostrarFiltrosPedidos ? (
        <div className="pedidos-filtros-card">
          <AdminPedidosFiltros
            filtroPedidos={filtroPedidos}
            setFiltroPedidos={setFiltroPedidos}
            fechaSeleccionada={fechaSeleccionada}
            setFechaSeleccionada={setFechaSeleccionada}
            fechaInicioRangoPedidos={fechaInicioRangoPedidos}
            setFechaInicioRangoPedidos={setFechaInicioRangoPedidos}
            fechaFinRangoPedidos={fechaFinRangoPedidos}
            setFechaFinRangoPedidos={setFechaFinRangoPedidos}
            hayBusquedaPedidos={hayBusquedaPedidos}
            setBusqueda={setBusqueda}
            busqueda={busqueda}
            busquedaNumeroPedido={busquedaNumeroPedido}
            setBusquedaNumeroPedido={setBusquedaNumeroPedido}
            buscarPedidoPorNumeroGlobal={buscarPedidoPorNumeroGlobal}
            limpiarBusquedaNumeroPedido={limpiarBusquedaNumeroPedido}
            cargandoNumeroPedido={cargandoNumeroPedido}
          />
        </div>
      ) : (
        <div className="pedidos-filtros-resumen-colapsado">
          <span>Filtros ocultos para limpiar la pantalla.</span>
          <button type="button" className="mini-btn" onClick={() => setMostrarFiltrosPedidos(true)}>Mostrar filtros</button>
        </div>
      )}

      {(resultadoNumeroPedido.length > 0 || errorNumeroPedido) && (
        <div className="pedido-numero-global-resultados">
          <div className="section-heading section-heading-pedidos-unificados">
            <h3>🔎 Resultado por número de pedido</h3>
            <span>{resultadoNumeroPedido.length}</span>
          </div>
          {errorNumeroPedido && resultadoNumeroPedido.length === 0 ? (
            <div className="alert alert-warning">{errorNumeroPedido}</div>
          ) : (
            <TablaPedidosCompacta
              pedidos={resultadoNumeroPedido}
              onCambiarEstado={cambiarEstadoPedido}
              guardandoEstadoPedidoId={guardandoEstadoPedidoId}
              onEliminarPedido={puedeEliminarPedido ? eliminarPedidoAdministrador : undefined}
              eliminandoPedidoId={eliminandoPedidoId}
              onEditarPedido={puedeEditarPedido ? abrirEditorPedido : undefined}
              editandoPedidoId={editandoPedidoId}
              onCambiarFechaPedido={puedeEditarPedido ? abrirCambioFechaPedido : undefined}
              cambiandoFechaPedidoId={editandoPedidoId}
              onCorregirClienteCredito={puedeEditarPedido ? abrirCorreccionClienteCredito : undefined}
              corrigiendoClientePedidoId={guardandoCorreccionClienteId}
            />
          )}
        </div>
      )}

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

      <div className="pedidos-carga-resumen" role="status">
        <p className="muted small">
          Mostrando {pedidosFiltrados.length} filtrado{pedidosFiltrados.length === 1 ? "" : "s"} de {pedidos.length} pedido{pedidos.length === 1 ? "" : "s"} cargado{pedidos.length === 1 ? "" : "s"}
          {totalPedidosServidor !== null ? ` · total del rango: ${totalPedidosServidor}` : ""}.
          {pedidosBorrados.length > 0 ? ` ${pedidosBorrados.length} en Pedidos Borrados no suman en ventas.` : ""}
        </p>
        {paginacionPedidos?.advertencia ? (
          <p className="muted small pedidos-carga-aviso">{paginacionPedidos.advertencia}</p>
        ) : null}
      </div>

      <RafikiTabs
        tabs={tabsPedidosHoy}
        activeTab={vistaPedidosHoy}
        onChange={setVistaPedidosHoy}
        className="pedidos-hoy-tabs"
        ariaLabel="Secciones de Pedidos Hoy"
      />

      {vistaPedidosHoy === "mesas" ? (
        <ResumenMesasHoy
          pedidosActivos={pedidosActivos}
          cambiarEstadoPedido={cambiarEstadoPedido}
          guardandoEstadoPedidoId={guardandoEstadoPedidoId}
          puedeEditarPedido={puedeEditarPedido}
          onEditarPedido={abrirEditorPedido}
          editandoPedidoId={editandoPedidoId}
        />
      ) : null}

      {vistaPedidosHoy === "pedidos" ? (
      <div className="pedido-seccion">
        {filtroRestauranteParaLlevar ? (
          <div className="alert alert-info pedidos-filtro-activo">
            Mostrando solo pedidos de <strong>Restaurante para llevar</strong>. Total: {pedidosRestauranteParaLlevar.length}.
          </div>
        ) : null}
        <div className="section-heading section-heading-pedidos-unificados">
          <h3>{filtroRestauranteParaLlevar ? "🥡 Restaurante para llevar" : "📋 Pedidos"}</h3>
          <div className="section-heading-actions pedidos-orden-actions">
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
            <button
              type="button"
              className={ordenPedidosHoy === "ultimos" ? "mini-btn active" : "mini-btn"}
              onClick={() => setOrdenPedidosHoy("ultimos")}
              title="Mostrar primero los últimos pedidos"
            >
              Últimos
            </button>
            <button
              type="button"
              className={ordenPedidosHoy === "primeros" ? "mini-btn active" : "mini-btn"}
              onClick={() => setOrdenPedidosHoy("primeros")}
              title="Mostrar desde el primer pedido del día"
            >
              Primeros
            </button>
            <span>{pedidosVisiblesTabla.length}</span>
          </div>
        </div>

        {pedidosVisiblesTabla.length === 0 ? (
          <RafikiEmptyState
            icon="📋"
            title={filtroRestauranteParaLlevar ? "No hay pedidos restaurante para llevar" : "No hay pedidos en esta vista"}
            description={filtroRestauranteParaLlevar ? "Cuando existan pedidos de restaurante marcados para llevar, aparecerán aquí y en la impresión 80mm." : "Cuando entren pedidos activos o finalizados, aparecerán aquí con sus estados, pagos y acciones."}
          />
        ) : (
          <TablaPedidosCompacta
            pedidos={pedidosVisiblesTabla}
            onCambiarEstado={cambiarEstadoPedido}
            guardandoEstadoPedidoId={guardandoEstadoPedidoId}
            onEliminarPedido={puedeEliminarPedido ? eliminarPedidoAdministrador : undefined}
            eliminandoPedidoId={eliminandoPedidoId}
            onEditarPedido={puedeEditarPedido ? abrirEditorPedido : undefined}
            editandoPedidoId={editandoPedidoId}
            onCambiarFechaPedido={puedeEditarPedido ? abrirCambioFechaPedido : undefined}
            cambiandoFechaPedidoId={editandoPedidoId}
            onCorregirClienteCredito={puedeEditarPedido ? abrirCorreccionClienteCredito : undefined}
            corrigiendoClientePedidoId={guardandoCorreccionClienteId}
          />
        )}
      </div>
      ) : null}

      {vistaPedidosHoy === "pedidos" && hayMasPedidos && (
        <div className="pedidos-cargar-mas-box">
          <div>
            <strong>Carga optimizada activa</strong>
            <p className="muted small">
              Se cargaron {totalCargadosServidor} de {totalPedidosServidor || "más"} pedido{totalCargadosServidor === 1 ? "" : "s"}.
              Puedes traer más resultados sin bloquear el celular.
            </p>
          </div>
          <button
            type="button"
            className="button light"
            onClick={cargarMasPedidos}
            disabled={cargandoMasPedidos || cargandoPedidos}
          >
            {cargandoMasPedidos ? "Cargando más..." : "Cargar más resultados"}
          </button>
        </div>
      )}

      {vistaPedidosHoy === "borrados" ? (
        <AdminPedidoGrupo
          icono="🗑️"
          titulo="Pedidos Borrados"
          pedidos={pedidosBorrados}
          mensajeVacio="No hay pedidos borrados."
          danger
          cambiarEstadoPedido={cambiarEstadoPedido}
          guardandoEstadoPedidoId={guardandoEstadoPedidoId}
          eliminandoPedidoId={eliminandoPedidoId}
          puedeEditarPedido={puedeEditarPedido}
          onEditarPedido={abrirEditorPedido}
          editandoPedidoId={editandoPedidoId}
        />
      ) : null}

      {pedidoEditando && (
        <EditarPedidoModal
          pedido={pedidoEditando}
          onCerrar={() => setPedidoEditando(null)}
          onGuardar={editarPedidoAdministrador}
          guardando={editandoPedidoId === pedidoEditando.id}
        />
      )}



      {pedidoCambiandoFecha && (
        <CambiarFechaPedidoModal
          pedido={pedidoCambiandoFecha}
          onCerrar={() => setPedidoCambiandoFecha(null)}
          onGuardar={cambiarFechaPedidoAdministrador}
          guardando={editandoPedidoId === pedidoCambiandoFecha.id}
        />
      )}

      {pedidoCorrigiendoCliente && (
        <CorregirClienteCreditoModal
          pedido={pedidoCorrigiendoCliente}
          onCerrar={() => {
            setPedidoCorrigiendoCliente(null);
            setMensajeCorreccionCliente("");
          }}
          onGuardar={guardarCorreccionClienteCredito}
          onRetirar={retirarPedidoDeCredito}
          guardando={guardandoCorreccionClienteId === pedidoCorrigiendoCliente.id}
          mensaje={mensajeCorreccionCliente}
        />
      )}

    </section>
  );
}

export default React.memo(AdminPedidosSectionBase);
