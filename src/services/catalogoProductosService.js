import { supabase } from "../supabaseClient";
import { generarId } from "../utils/pedidos";

export function normalizarProductoAdmin(producto, index = 0) {
  const nombre = String(producto?.nombre || "").trim();
  if (!nombre) return null;

  const precioNormalizado = producto?.precio === null || producto?.precio === undefined || producto?.precio === "" ? "" : Number(producto.precio);

  return {
    id: producto?.id ? String(producto.id) : generarId("producto-admin"),
    catalogoId: producto?.id || null,
    linea: String(producto?.linea || "Cafetería").trim() || "Cafetería",
    categoria: String(producto?.categoria || "Productos").trim() || "Productos",
    nombre,
    precio: Number.isFinite(precioNormalizado) ? precioNormalizado : "",
    activo: producto?.activo !== false,
    orden: Number.isFinite(Number(producto?.orden)) ? Number(producto.orden) : index + 1,
    origenCatalogo: producto?.origenCatalogo || "bd"
  };
}

export async function cargarCatalogoProductosAdmin() {
  try {
    const { data, error } = await supabase
      .from("catalogo_productos")
      .select("id, linea, categoria, nombre, precio, activo, orden")
      .order("linea", { ascending: true })
      .order("orden", { ascending: true })
      .order("nombre", { ascending: true });

    if (error) {
      return { ok: false, productos: [], mensaje: error.message };
    }

    return {
      ok: true,
      productos: (data || []).map(normalizarProductoAdmin).filter(Boolean),
      mensaje: `Catálogo de productos cargado desde Supabase (${(data || []).length} registros).`
    };
  } catch (error) {
    return { ok: false, productos: [], mensaje: error?.message || "No se pudo cargar el catálogo de productos." };
  }
}

export async function crearProductoCatalogoAdmin({ linea = "Cafetería", categoria, nombre, precio = "", orden = 0 }) {
  const payload = {
    linea: String(linea || "Cafetería").trim() || "Cafetería",
    categoria: String(categoria || "Productos").trim() || "Productos",
    nombre: String(nombre || "").trim(),
    precio: precio === "" || precio == null ? null : Number(precio),
    activo: true,
    orden: Number.isFinite(Number(orden)) ? Number(orden) : 0
  };

  const { data, error } = await supabase
    .from("catalogo_productos")
    .insert(payload)
    .select("id, linea, categoria, nombre, precio, activo, orden")
    .single();

  if (error) throw error;
  return normalizarProductoAdmin(data);
}

export async function actualizarProductoCatalogoAdmin(id, cambios) {
  const payload = {};
  if (Object.prototype.hasOwnProperty.call(cambios, "linea")) payload.linea = String(cambios.linea || "Cafetería").trim() || "Cafetería";
  if (Object.prototype.hasOwnProperty.call(cambios, "categoria")) payload.categoria = String(cambios.categoria || "Productos").trim() || "Productos";
  if (Object.prototype.hasOwnProperty.call(cambios, "nombre")) payload.nombre = String(cambios.nombre || "").trim();
  if (Object.prototype.hasOwnProperty.call(cambios, "precio")) payload.precio = cambios.precio === "" || cambios.precio == null ? null : Number(cambios.precio);
  if (Object.prototype.hasOwnProperty.call(cambios, "activo")) payload.activo = Boolean(cambios.activo);
  if (Object.prototype.hasOwnProperty.call(cambios, "orden")) payload.orden = Number.isFinite(Number(cambios.orden)) ? Number(cambios.orden) : 0;

  const { data, error } = await supabase
    .from("catalogo_productos")
    .update(payload)
    .eq("id", id)
    .select("id, linea, categoria, nombre, precio, activo, orden")
    .single();

  if (error) throw error;
  return normalizarProductoAdmin(data);
}
