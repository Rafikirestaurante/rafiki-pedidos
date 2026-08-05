function normalizarNombreInsumo(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function normalizarJornadaInsumos(valor) {
  const texto = String(valor || "").trim().toUpperCase();
  if (texto === "AM" || texto === "PM") return texto;
  if (texto.includes("MAÑANA") || texto.includes("MANANA")) return "AM";
  if (texto.includes("TARDE") || texto.includes("NOCHE")) return "PM";
  return "";
}

function obtenerJornadaActualColombia(fecha = new Date()) {
  const horaTexto = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    hour: "2-digit",
    hour12: false,
    hourCycle: "h23"
  }).format(fecha);

  return Number(horaTexto) < 12 ? "AM" : "PM";
}

function obtenerInsumosSolicitud(solicitud) {
  if (Array.isArray(solicitud?.insumos)) return solicitud.insumos;
  if (Array.isArray(solicitud?.productos)) return solicitud.productos;
  return [];
}

export function obtenerJornadaProductoSolicitud(producto = {}, solicitud = {}) {
  const directa = normalizarJornadaInsumos(
    producto.jornadaSolicitud ||
      producto.jornada_solicitud ||
      producto.jornada ||
      solicitud.jornadaSolicitud ||
      solicitud.jornada_solicitud ||
      solicitud.jornada
  );

  if (directa) return directa;

  const horaTexto = String(
    producto.horaSolicitud ||
      producto.hora_solicitud ||
      producto.solicitadoEn ||
      solicitud.horaSolicitud ||
      solicitud.hora_solicitud ||
      solicitud.created_at ||
      ""
  );

  const horaMatch = horaTexto.match(/(?:T|\s|^)(\d{1,2}):\d{2}/);
  if (!horaMatch) return "";

  const hora = Number(horaMatch[1]);
  if (!Number.isFinite(hora)) return "";

  return hora < 12 ? "AM" : "PM";
}

export function describirJornadaInsumos(jornada) {
  return normalizarJornadaInsumos(jornada) === "AM" ? "mañana" : "tarde";
}

export function clasificarProductosSolicitudPorJornada(
  solicitudesDelDia,
  productosSeleccionados,
  jornadaActual
) {
  const jornadaNormalizada = normalizarJornadaInsumos(jornadaActual) || obtenerJornadaActualColombia();
  const jornadasPorProducto = new Map();

  (solicitudesDelDia || []).forEach((solicitud) => {
    obtenerInsumosSolicitud(solicitud).forEach((producto) => {
      const clave = normalizarNombreInsumo(producto?.nombre || "");
      if (!clave) return;

      const jornada = obtenerJornadaProductoSolicitud(producto, solicitud);
      if (!jornada) return;

      const jornadas = jornadasPorProducto.get(clave) || new Set();
      jornadas.add(jornada);
      jornadasPorProducto.set(clave, jornadas);
    });
  });

  const repetidosMismaJornada = [];
  const repetidosOtraJornada = [];
  const productosPermitidos = [];

  (productosSeleccionados || []).forEach((producto) => {
    const clave = normalizarNombreInsumo(producto?.nombre || "");
    const jornadasPrevias = jornadasPorProducto.get(clave) || new Set();

    if (jornadasPrevias.has(jornadaNormalizada)) {
      repetidosMismaJornada.push(producto);
      return;
    }

    productosPermitidos.push(producto);

    const jornadaContraria = jornadaNormalizada === "AM" ? "PM" : "AM";
    if (jornadasPrevias.has(jornadaContraria)) {
      repetidosOtraJornada.push(producto);
    }
  });

  return {
    jornadaActual: jornadaNormalizada,
    repetidosMismaJornada,
    repetidosOtraJornada,
    productosPermitidos
  };
}
