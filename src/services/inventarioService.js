import { supabase } from "../supabaseClient";

const SELECT_INSUMOS = "id, nombre, categoria, unidad, stock_actual, stock_minimo, costo_promedio, activo, creado_en, actualizado_en";
const SELECT_MOVIMIENTOS = "id, insumo_id, tipo, cantidad, motivo, fecha, usuario, creado_en";

export const CATEGORIAS_INVENTARIO = ["Carnes", "Verduras", "Granos", "Lácteos", "Frutas", "Bebidas", "Desechables", "Aseo", "Otros"];
export const UNIDADES_INVENTARIO = ["kg", "g", "lb", "unidad", "paquete", "litro", "ml", "bolsa", "caja"];
export const TIPOS_MOVIMIENTO_INVENTARIO = ["entrada", "salida", "ajuste", "merma"];

export function obtenerFechaInventarioHoy() {
  const fecha = new Date();
  const offsetMs = -5 * 60 * 60 * 1000;
  return new Date(fecha.getTime() + offsetMs).toISOString().slice(0, 10);
}

export function normalizarInsumoInventario(item) {
  if (!item) return null;
  return {
    id: item.id,
    nombre: item.nombre || "",
    categoria: item.categoria || "Otros",
    unidad: item.unidad || "unidad",
    stockActual: Number(item.stock_actual || 0),
    stockMinimo: Number(item.stock_minimo || 0),
    costoPromedio: Number(item.costo_promedio || 0),
    activo: item.activo !== false,
    creadoEn: item.creado_en || "",
    actualizadoEn: item.actualizado_en || ""
  };
}

function prepararPayloadInsumo(insumo) {
  return {
    nombre: String(insumo.nombre || "").trim(),
    categoria: String(insumo.categoria || "Otros").trim() || "Otros",
    unidad: String(insumo.unidad || "unidad").trim() || "unidad",
    stock_actual: Number(insumo.stockActual || 0),
    stock_minimo: Number(insumo.stockMinimo || 0),
    costo_promedio: Number(insumo.costoPromedio || 0),
    activo: insumo.activo !== false,
    actualizado_en: new Date().toISOString()
  };
}

export async function cargarInventarioInsumos({ incluirInactivos = false } = {}) {
  let consulta = supabase.from("inventario_insumos").select(SELECT_INSUMOS).order("categoria", { ascending: true }).order("nombre", { ascending: true });
  if (!incluirInactivos) consulta = consulta.eq("activo", true);
  const { data, error } = await consulta;
  if (error) throw error;
  return (data || []).map(normalizarInsumoInventario).filter(Boolean);
}

export async function guardarInventarioInsumo(insumo) {
  const payload = prepararPayloadInsumo(insumo);
  if (!payload.nombre) throw new Error("El nombre del insumo es obligatorio.");
  if (!Number.isFinite(payload.stock_actual)) throw new Error("El stock actual no es válido.");

  if (insumo.id) {
    const { data, error } = await supabase.from("inventario_insumos").update(payload).eq("id", insumo.id).select(SELECT_INSUMOS).single();
    if (error) throw error;
    return normalizarInsumoInventario(data);
  }

  const { data, error } = await supabase.from("inventario_insumos").insert(payload).select(SELECT_INSUMOS).single();
  if (error) throw error;
  return normalizarInsumoInventario(data);
}

export async function registrarMovimientoInventario({ insumoId, tipo, cantidad, motivo, usuario }) {
  const payload = {
    insumo_id: insumoId,
    tipo,
    cantidad: Number(cantidad || 0),
    motivo: String(motivo || "").trim() || null,
    fecha: obtenerFechaInventarioHoy(),
    usuario: String(usuario || "").trim() || null
  };
  if (!payload.insumo_id) throw new Error("Selecciona un insumo.");
  if (!TIPOS_MOVIMIENTO_INVENTARIO.includes(payload.tipo)) throw new Error("Tipo de movimiento no válido.");
  if (!Number.isFinite(payload.cantidad) || payload.cantidad <= 0) throw new Error("La cantidad debe ser mayor a cero.");

  const { data, error } = await supabase.rpc("registrar_movimiento_inventario", payload).select?.(SELECT_MOVIMIENTOS);
  if (error) throw error;
  return data;
}

export async function registrarEntradaInventarioDesdeGasto({ gastoId, insumoId, cantidad, motivo, fecha, usuario }) {
  const payload = {
    gasto_id: gastoId || null,
    insumo_id: insumoId,
    cantidad: Number(cantidad || 0),
    motivo: String(motivo || "Compra registrada desde Gastos").trim() || "Compra registrada desde Gastos",
    fecha: fecha || obtenerFechaInventarioHoy(),
    usuario: String(usuario || "Gastos").trim() || "Gastos"
  };

  if (!payload.insumo_id) throw new Error("Selecciona un insumo para actualizar inventario.");
  if (!Number.isFinite(payload.cantidad) || payload.cantidad <= 0) throw new Error("La cantidad de inventario debe ser mayor a cero.");

  const { data, error } = await supabase
    .rpc("registrar_entrada_inventario_desde_gasto", payload);

  if (error) throw error;
  return data;
}

function normalizarUnidadDesdeCatalogo(unidadBase) {
  const unidad = String(unidadBase || "unidad").trim().toLowerCase();
  if (["kg", "kilo", "kilos"].includes(unidad)) return "kg";
  if (["g", "gr", "gramo", "gramos"].includes(unidad)) return "g";
  if (["lt", "l", "litro", "litros"].includes(unidad)) return "litro";
  if (["ml", "mililitro", "mililitros"].includes(unidad)) return "ml";
  if (["und", "unidad", "unidades"].includes(unidad)) return "unidad";
  if (UNIDADES_INVENTARIO.includes(unidad)) return unidad;
  return "unidad";
}

export async function sincronizarInventarioDesdeCatalogoInsumos(insumosInventarioActuales = []) {
  const existentes = new Set(
    (insumosInventarioActuales || [])
      .map((item) => String(item?.nombre || "").trim().toLowerCase())
      .filter(Boolean)
  );

  const { data, error } = await supabase
    .from("catalogo_insumos")
    .select("categoria, nombre, unidad_base, activo, orden")
    .eq("activo", true)
    .order("categoria", { ascending: true })
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });

  if (error) throw error;

  const nuevos = (data || [])
    .filter((item) => {
      const nombre = String(item?.nombre || "").trim();
      return nombre && !existentes.has(nombre.toLowerCase());
    })
    .map((item) => ({
      nombre: String(item.nombre || "").trim(),
      categoria: String(item.categoria || "Otros").trim() || "Otros",
      unidad: normalizarUnidadDesdeCatalogo(item.unidad_base),
      stock_actual: 0,
      stock_minimo: 0,
      costo_promedio: 0,
      activo: true,
      actualizado_en: new Date().toISOString()
    }));

  if (!nuevos.length) return [];

  const { data: insertados, error: insertError } = await supabase
    .from("inventario_insumos")
    .insert(nuevos)
    .select(SELECT_INSUMOS);

  if (insertError) throw insertError;
  return (insertados || []).map(normalizarInsumoInventario).filter(Boolean);
}

export function calcularResumenInventario(insumos = []) {
  const activos = insumos.filter((item) => item.activo !== false);
  const stockBajo = activos.filter((item) => item.stockActual <= item.stockMinimo);
  const agotados = activos.filter((item) => item.stockActual <= 0);
  const valorEstimado = activos.reduce((total, item) => total + item.stockActual * item.costoPromedio, 0);
  return { totalInsumos: activos.length, stockBajo: stockBajo.length, agotados: agotados.length, valorEstimado };
}
