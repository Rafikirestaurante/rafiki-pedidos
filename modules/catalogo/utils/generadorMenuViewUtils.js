import { PRODUCTOS_CATALOGO_FALLBACK } from "../../../data/catalogoProductosData";
import { obtenerPlatosSinPrecio } from "../../../shared/utils/generadorMenu";

export const GENERADOR_MENU_DRAFT_KEY = "rafikiGeneradorMenuBorrador21J5";

export const PLATOS_GENERADOR_DEFECTO = [];

export const ACOMPANANTES_GENERADOR_DEFECTO = "";

export const PRODUCTOS_OCULTOS_GENERADOR = [
  "Pechuga asada sin Salsa",
  "Cerdo asado sin salsa",
  "Sopas medianas sin arroz",
  "Sopas medianas con arroz",
  "Sancocho de pollo",
  "Sancocho de pollo con arroz"
];

export function normalizarTextoCatalogo(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}


export function esProductoOcultoGenerador(producto) {
  const clave = normalizarTextoCatalogo(producto?.nombre || producto);
  return PRODUCTOS_OCULTOS_GENERADOR.some((nombre) => normalizarTextoCatalogo(nombre) === clave);
}

export function clasificarPlatoVisual(producto) {
  const nombre = producto?.nombre || "";
  const normalizado = normalizarTextoCatalogo(nombre);
  if (normalizado.startsWith("pechuga o cerdo")) return "pechugaCerdo";
  if (normalizado.startsWith("pastas")) return "pastas";
  return "guisos";
}

export function nombreVisualPlato(producto) {
  const nombre = String(producto?.nombre || "").trim();
  const tipo = clasificarPlatoVisual(producto);

  if (tipo === "pechugaCerdo") {
    return nombre
      .replace(/^Pechuga o cerdo\s+en\s+/i, "")
      .replace(/^Pechuga o cerdo\s+/i, "")
      .replace(/^salsa\s+/i, "Salsa ")
      .trim();
  }

  if (tipo === "pastas") {
    return nombre.replace(/^Pastas\s*/i, "").trim();
  }

  return nombre;
}

export function agruparPlatosVisuales(productos) {
  return [
    { key: "pechugaCerdo", titulo: "Pechuga y cerdo", productos: productos.filter((producto) => clasificarPlatoVisual(producto) === "pechugaCerdo") },
    { key: "pastas", titulo: "Pastas", productos: productos.filter((producto) => clasificarPlatoVisual(producto) === "pastas") },
    { key: "guisos", titulo: "Guisos y demás", productos: productos.filter((producto) => clasificarPlatoVisual(producto) === "guisos") }
  ].filter((grupo) => grupo.productos.length > 0);
}


export function esSopaResumen(nombre) {
  const normalizado = normalizarTextoCatalogo(nombre?.nombre || nombre);
  return /\b(ajiaco|mote|mondongo|costilla|gallina|paticas|sancocho|sopa|sopas)\b/.test(normalizado);
}

export function ordenPlatoResumen(plato) {
  const normalizado = normalizarTextoCatalogo(plato?.nombre || plato);
  if (esSopaResumen(plato)) return 3;
  if (normalizado.startsWith("pechuga o cerdo") || normalizado.startsWith("pechuga ") || normalizado.startsWith("cerdo ")) return 2;
  if (normalizado.startsWith("pastas")) return 1;
  return 0;
}

export function ordenarPlatosResumen(platos = []) {
  return [...platos].sort((a, b) => {
    const orden = ordenPlatoResumen(a) - ordenPlatoResumen(b);
    if (orden !== 0) return orden;
    return String(a?.nombre || a).localeCompare(String(b?.nombre || b), "es", { sensitivity: "base" });
  });
}

export function ordenAcompananteResumen(nombre) {
  const normalizado = normalizarTextoCatalogo(nombre?.nombre || nombre);
  if (normalizado.startsWith("arroz")) return 0;
  if (normalizado.startsWith("ensalada")) return 2;
  return 1;
}

export function ordenarAcompanantesResumen(items = []) {
  return [...items].sort((a, b) => {
    const orden = ordenAcompananteResumen(a) - ordenAcompananteResumen(b);
    if (orden !== 0) return orden;
    return String(a?.nombre || a).localeCompare(String(b?.nombre || b), "es", { sensitivity: "base" });
  });
}

export function categoriaRotacionMenu(producto) {
  const categoria = normalizarTextoCatalogo(producto?.categoria || "");
  const nombre = normalizarTextoCatalogo(producto?.nombre || producto);

  if (categoria.includes("sopa") || esSopaResumen(nombre)) return "sopas";
  if (categoria.includes("pasta") || nombre.startsWith("pastas")) return "pastas";
  if (categoria.includes("guiso")) return "guisos";

  if (categoria.includes("plato")) {
    if (nombre.startsWith("pechuga") || nombre.startsWith("cerdo") || nombre.startsWith("pechuga o cerdo")) return "platos";
    return "guisos";
  }

  return null;
}

export function obtenerNombresHistorialRotacion(registro) {
  if (!registro) return [];
  if (Array.isArray(registro.platos)) {
    return registro.platos
      .map((plato) => String(plato?.nombre || plato || "").trim())
      .filter(Boolean);
  }
  return obtenerPlatosSinPrecio(registro);
}

export function fechaDentroDeRangoMenu(fecha, dias) {
  if (!fecha) return false;
  const fechaRegistro = new Date(`${fecha}T12:00:00`);
  if (Number.isNaN(fechaRegistro.getTime())) return false;

  const hoy = new Date();
  const limite = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  limite.setDate(limite.getDate() - (Number(dias) - 1));
  return fechaRegistro >= limite;
}

export function productosRestauranteFallback() {
  return PRODUCTOS_CATALOGO_FALLBACK
    .filter((item) => item.linea === "Restaurante" && item.activo !== false && item.agotado !== true)
    .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0) || String(a.nombre).localeCompare(String(b.nombre)));
}

export function filtrarCatalogoMenu(productos, categoria) {
  return productos
    .filter((item) => item.linea === "Restaurante" && item.categoria === categoria && item.activo !== false && item.agotado !== true)
    .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0) || String(a.nombre).localeCompare(String(b.nombre)));
}

export function tipoAlertaGenerador(texto) {
  const normalizado = String(texto || "").toLowerCase();
  if (normalizado.includes("no se pudo") || normalizado.includes("error")) return "error";
  if (normalizado.includes("selecciona") || normalizado.includes("agrega")) return "advertencia";
  if (normalizado.includes("correctamente") || normalizado.includes("guardad") || normalizado.includes("descargad") || normalizado.includes("copiad")) return "exito";
  return "info";
}

export function tituloAlertaGenerador(tipo) {
  if (tipo === "error") return "Revisar generador";
  if (tipo === "advertencia") return "Falta un paso";
  if (tipo === "exito") return "Acción realizada";
  return "Aviso del generador";
}

export function leerBorradorGeneradorMenu() {
  if (typeof window === "undefined" || !window.localStorage) return null;

  try {
    const raw = window.localStorage.getItem(GENERADOR_MENU_DRAFT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return null;
    return data;
  } catch {
    return null;
  }
}

