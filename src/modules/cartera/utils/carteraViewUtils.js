import { FORMAS_PAGO_ABONO_CARTERA, METODOS_PAGO } from "../../../shared/constants/paymentMethods";
import { aPesosEnteros } from "../../../shared/utils/money";
import {
  fechaColombiaYYYYMMDD,
  fechaDentroRangoColombia,
  formatearFechaColombia,
  formatearFechaHoraColombia,
} from "../../../shared/utils/fechasColombia";
import { obtenerNombreCafeteria } from "../../../shared/utils/resumenPedidoDisplay";

export const FORM_INICIAL = {
  nombre: "",
  telefono: "",
  observaciones: "",
};

export const FILTROS_INICIALES = {
  texto: "",
  pedido: "",
  descripcion: "",
  estado: "todos",
  clienteId: "",
  fechaInicio: "",
  fechaFin: "",
  soloConSaldo: true,
};

export const METODOS_ABONO = FORMAS_PAGO_ABONO_CARTERA;

export const VISTA_CARTERA_INICIAL = "cartera";

export const ABONO_INICIAL = {
  valorAbono: "",
  metodoPago: METODOS_PAGO.EFECTIVO,
  observacion: "",
  fechaAbono: fechaColombiaYYYYMMDD(),
};

export function dinero(valor) {
  return Number(valor || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

export function resumirPorEstadoMovimientos(movimientos = []) {
  const mapa = new Map();
  (Array.isArray(movimientos) ? movimientos : []).forEach((movimiento) => {
    const estado = estadoCartera(movimiento);
    const actual = mapa.get(estado) || { cantidad: 0, valor: 0, saldo: 0 };
    actual.cantidad += 1;
    if (estado !== "anulado") actual.valor += aPesosEnteros(movimiento.valor);
    if (movimientoPendiente(movimiento)) actual.saldo += saldoMovimiento(movimiento);
    mapa.set(estado, actual);
  });

  return Array.from(mapa.entries())
    .sort(([a], [b]) => String(a).localeCompare(String(b), "es", { sensitivity: "base" }))
    .map(([estado, datos]) => ({
      etiqueta: `${estado} (${datos.cantidad})`,
      valor: `${dinero(datos.valor)} · saldo ${dinero(datos.saldo)}`,
    }));
}

export function resumirAbonosPorMetodo(abonos = []) {
  const mapa = new Map();
  (Array.isArray(abonos) ? abonos : []).forEach((abono) => {
    const metodo = String(abono.metodo_pago || abono.metodoPago || "Sin método").trim() || "Sin método";
    const actual = mapa.get(metodo) || { cantidad: 0, total: 0 };
    actual.cantidad += 1;
    actual.total += aPesosEnteros(abono.valor_abono);
    mapa.set(metodo, actual);
  });

  return Array.from(mapa.entries())
    .sort(([a], [b]) => String(a).localeCompare(String(b), "es", { sensitivity: "base" }))
    .map(([metodo, datos]) => ({
      etiqueta: `${metodo} (${datos.cantidad})`,
      valor: dinero(datos.total),
    }));
}


export function escaparHtmlExcel(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function descargarArchivo(nombreArchivo, contenido, tipo = "application/vnd.ms-excel;charset=utf-8") {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

export function nombreArchivoSeguro(valor) {
  return normalizarTexto(valor || "cartera")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "cartera";
}

export function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function formatearFecha(valor) {
  return formatearFechaColombia(valor);
}

export function formatearFechaHora(valor) {
  return formatearFechaHoraColombia(valor);
}

export function fechaDentroRango(valor, fechaInicio, fechaFin) {
  return fechaDentroRangoColombia(valor, fechaInicio, fechaFin);
}

export function estadoCartera(movimiento) {
  return String(movimiento?.estado || "pendiente").trim().toLowerCase();
}

export function saldoMovimiento(movimiento) {
  return Number(movimiento?.saldo_movimiento ?? movimiento?.valor ?? 0) || 0;
}

export function movimientoPendiente(movimiento) {
  const estado = estadoCartera(movimiento);
  return estado !== "pagado" && estado !== "anulado" && saldoMovimiento(movimiento) > 0;
}

export function telefonoWhatsApp(telefono) {
  const digitos = String(telefono || "").replace(/\D/g, "");
  if (!digitos) return "";
  if (digitos.length === 10) return `57${digitos}`;
  return digitos;
}

export function resumirLineaPedidoTexto(texto = "") {
  return String(texto || "")
    .split(/\n+/)
    .map((linea) => linea.replace(/^[-•*\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(" · ");
}

export function nombreItemPedidoCompacto(item = {}) {
  const cantidad = Number(item.cantidad) || 1;
  const esCafeteria = item?.categoria === "cafeteria" || item?.area === "cafeteria";

  if (esCafeteria) {
    return `${cantidad} ${obtenerNombreCafeteria(item)}`;
  }

  const nombre = item.detalle_impresion
    || item.producto
    || item.nombre
    || item.plato
    || item.proteina
    || item.tipo
    || "Producto";
  const acompanantes = Array.isArray(item.acompanantes) && item.acompanantes.length > 0
    ? ` · ${item.acompanantes.slice(0, 3).join(", ")}`
    : "";
  const tamano = item.tamano ? ` · ${item.tamano}` : "";
  return `${cantidad} ${nombre}${tamano}${acompanantes}`;
}

export function nombreItemSoloProteina(item = {}) {
  const cantidad = Number(item.cantidad) || 1;
  const esCafeteria = item?.categoria === "cafeteria" || item?.area === "cafeteria";

  if (esCafeteria) return `${cantidad} ${obtenerNombreCafeteria(item)}`;

  const proteina = item.proteina
    || item.plato
    || item.producto
    || item.nombre
    || item.tipo
    || "Producto";
  return `${cantidad} ${proteina}`;
}

export function resumenPedidoMovimiento(movimiento = {}) {
  const items = Array.isArray(movimiento.pedido_items) ? movimiento.pedido_items : [];
  if (items.length > 0) {
    const resumen = items.slice(0, 3).map(nombreItemPedidoCompacto).join(" + ");
    const restantes = items.length > 3 ? ` + ${items.length - 3} más` : "";
    return `${resumen}${restantes}`;
  }

  const textoPedido = resumirLineaPedidoTexto(movimiento.pedido_texto_detalle);
  if (textoPedido) return textoPedido;

  return movimiento.concepto || "Pedido crédito";
}

export function resumenSoloProteinaMovimiento(movimiento = {}) {
  const items = Array.isArray(movimiento.pedido_items) ? movimiento.pedido_items : [];
  if (items.length === 0) return resumenPedidoMovimiento(movimiento);

  const resumen = items.slice(0, 3).map(nombreItemSoloProteina).join(" + ");
  const restantes = items.length > 3 ? ` + ${items.length - 3} más` : "";
  return `${resumen}${restantes}`;
}

export function textoBusquedaMovimiento(movimiento) {
  return [
    movimiento.numero_pedido,
    movimiento.cliente_nombre,
    movimiento.concepto,
    resumenPedidoMovimiento(movimiento),
    movimiento.estado,
    movimiento.observaciones,
  ]
    .filter(Boolean)
    .join(" ");
}

export function construirEstadoCuenta(movimientos = [], abonos = [], { soloProteina = false } = {}) {
  const lineas = [
    ...(Array.isArray(movimientos) ? movimientos : []).map((movimiento) => ({
      id: `pedido-${movimiento.id}`,
      fecha: movimiento.fecha_movimiento || movimiento.created_at,
      tipo: "Pedido a crédito",
      referencia: movimiento.numero_pedido ? `#${movimiento.numero_pedido}` : "—",
      descripcion: soloProteina ? resumenSoloProteinaMovimiento(movimiento) : resumenPedidoMovimiento(movimiento),
      pedido: estadoCartera(movimiento) === "anulado" ? 0 : aPesosEnteros(movimiento.valor),
      pago: 0,
      estado: estadoCartera(movimiento),
    })),
    ...(Array.isArray(abonos) ? abonos : []).map((abono) => ({
      id: `abono-${abono.id}`,
      fecha: abono.fecha_abono || abono.created_at,
      tipo: "Pago recibido",
      referencia: abono.numero_pedido ? `Pedido #${abono.numero_pedido}` : "Abono",
      descripcion: [abono.metodo_pago, abono.observacion].filter(Boolean).join(" · ") || "Abono a cartera",
      pedido: 0,
      pago: aPesosEnteros(abono.valor_abono),
      estado: "aplicado",
    })),
  ].sort((a, b) => {
    const diferencia = new Date(a.fecha || 0).getTime() - new Date(b.fecha || 0).getTime();
    return diferencia || String(a.id).localeCompare(String(b.id));
  });

  let saldo = 0;
  return lineas.map((linea) => {
    saldo = Math.max(0, saldo + linea.pedido - linea.pago);
    return { ...linea, saldo };
  });
}

export function conTiempoMaximo(promesa, ms = 18000, nombre = "consulta") {
  let timerId = null;
  const timeout = new Promise((_, reject) => {
    timerId = window.setTimeout(() => {
      reject(new Error(`${nombre} tardó demasiado en responder. Revisa la conexión e intenta actualizar nuevamente.`));
    }, ms);
  });

  return Promise.race([promesa, timeout]).finally(() => {
    if (timerId) window.clearTimeout(timerId);
  });
}
