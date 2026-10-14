import { PRODUCTOS_CATALOGO_FALLBACK } from "../../../data/catalogoProductosData";

export const STORAGE_CATALOGO_PRODUCTOS_MESAS = "rafiki_catalogo_productos_v1";

export function leerProductosCatalogoStorageMesas() {
  if (typeof window === "undefined") return PRODUCTOS_CATALOGO_FALLBACK;
  try {
    const raw = window.localStorage.getItem(STORAGE_CATALOGO_PRODUCTOS_MESAS);
    if (!raw) return PRODUCTOS_CATALOGO_FALLBACK;
    const data = JSON.parse(raw);
    return Array.isArray(data) && data.length ? data : PRODUCTOS_CATALOGO_FALLBACK;
  } catch {
    return PRODUCTOS_CATALOGO_FALLBACK;
  }
}

export function guardarProductosCatalogoStorageMesas(productos) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_CATALOGO_PRODUCTOS_MESAS, JSON.stringify(productos));
  } catch {
    // Respaldo silencioso: si localStorage falla, seguimos con el fallback importado.
  }
}

export function normalizarTextoCatalogo(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function productosCatalogoPorCategoria(productos, categoria, fallback = [], { soloConPrecio = true, linea = "Cafetería" } = {}) {
  const categoriaNormalizada = normalizarTextoCatalogo(categoria);
  const lineaNormalizada = normalizarTextoCatalogo(linea);
  const filtrados = (productos || [])
    .filter((producto) => producto?.activo !== false && producto?.agotado !== true)
    .filter((producto) => normalizarTextoCatalogo(producto?.linea || "Cafetería") === lineaNormalizada)
    .filter((producto) => normalizarTextoCatalogo(producto?.categoria) === categoriaNormalizada)
    .filter((producto) => !soloConPrecio || Number(producto?.precio || 0) > 0)
    .sort((a, b) => Number(a?.orden || 0) - Number(b?.orden || 0) || String(a?.nombre || "").localeCompare(String(b?.nombre || ""), "es"))
    .map((producto) => ({ nombre: producto.nombre, precio: Number(producto.precio || 0) }));

  return filtrados.length ? filtrados : fallback;
}

export function saboresCatalogoPorCategoria(productos, categoria, fallback = []) {
  const categoriaNormalizada = normalizarTextoCatalogo(categoria);
  const filtrados = (productos || [])
    .filter((producto) => producto?.activo !== false && producto?.agotado !== true)
    .filter((producto) => normalizarTextoCatalogo(producto?.linea || "Cafetería") === "cafeteria")
    .filter((producto) => normalizarTextoCatalogo(producto?.categoria) === categoriaNormalizada)
    .sort((a, b) => Number(a?.orden || 0) - Number(b?.orden || 0) || String(a?.nombre || "").localeCompare(String(b?.nombre || ""), "es"))
    .map((producto) => producto.nombre)
    .filter(Boolean);

  return filtrados.length ? filtrados : fallback;
}

