import { supabase, supabaseConfigOk } from "../supabaseClient";

export const MESEROS_FALLBACK = ["Rafa", "Ara", "Pao", "Jesús"];
const STORAGE_MESEROS = "rafiki_meseros_v1";

function limpiarNombre(valor) {
  return String(valor || "").trim().replace(/\s+/g, " ");
}

function normalizarMesero(item, index = 0) {
  const nombre = limpiarNombre(item?.nombre || item);
  if (!nombre) return null;
  return {
    id: item?.id || `local-${nombre.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}`,
    nombre,
    activo: item?.activo !== false,
    orden: Number.isFinite(Number(item?.orden)) ? Number(item.orden) : index + 1,
    origen: item?.origen || (item?.id ? "bd" : "local")
  };
}

function fallbackMeseros() {
  return MESEROS_FALLBACK.map((nombre, index) => normalizarMesero({ nombre, activo: true, orden: index + 1, origen: "local" }, index));
}

function guardarCache(items) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_MESEROS, JSON.stringify(items));
  } catch {
    // El catálogo de meseros puede seguir funcionando sin caché local.
  }
}

function leerCache() {
  if (typeof window === "undefined") return fallbackMeseros();
  try {
    const raw = window.localStorage.getItem(STORAGE_MESEROS);
    const data = raw ? JSON.parse(raw) : null;
    const normalizados = Array.isArray(data) ? data.map(normalizarMesero).filter(Boolean) : [];
    return normalizados.length > 0 ? normalizados : fallbackMeseros();
  } catch {
    return fallbackMeseros();
  }
}

function mensajeSqlPendiente(error) {
  const texto = String(error?.message || error?.details || error?.hint || "").toLowerCase();
  return texto.includes("meseros") || texto.includes("schema cache") || texto.includes("does not exist");
}

export async function listarMeseros({ soloActivos = false } = {}) {
  const respaldo = leerCache();
  if (!supabaseConfigOk) return { ok: false, meseros: soloActivos ? respaldo.filter((item) => item.activo) : respaldo, fuente: "local", mensaje: "Supabase no está configurado." };

  let consulta = supabase
    .from("meseros")
    .select("id,nombre,activo,orden,created_at,updated_at")
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });

  if (soloActivos) consulta = consulta.eq("activo", true);

  const { data, error } = await consulta;
  if (error) {
    return {
      ok: false,
      meseros: soloActivos ? respaldo.filter((item) => item.activo) : respaldo,
      fuente: "local",
      mensaje: mensajeSqlPendiente(error)
        ? "Ejecuta el SQL de la Fase 39 para activar la administración de meseros en Supabase."
        : String(error.message || "No se pudieron cargar los meseros.")
    };
  }

  const meseros = (Array.isArray(data) ? data : []).map(normalizarMesero).filter(Boolean);
  if (meseros.length > 0) guardarCache(meseros);
  return { ok: true, meseros: meseros.length > 0 ? meseros : respaldo, fuente: "bd", mensaje: "" };
}

export async function listarMeserosActivos() {
  const resultado = await listarMeseros({ soloActivos: true });
  return resultado.meseros.filter((item) => item.activo !== false).map((item) => item.nombre);
}

export async function crearMesero({ nombre, orden = 0 } = {}) {
  const nombreLimpio = limpiarNombre(nombre);
  if (!nombreLimpio) throw new Error("Escribe el nombre del mesero.");
  if (!supabaseConfigOk) throw new Error("Supabase no está configurado.");

  const { data, error } = await supabase
    .from("meseros")
    .insert({ nombre: nombreLimpio, activo: true, orden: Number(orden) || 0 })
    .select("id,nombre,activo,orden,created_at,updated_at")
    .single();

  if (error) {
    if (mensajeSqlPendiente(error)) throw new Error("Ejecuta el SQL de la Fase 39 antes de crear o editar meseros.");
    if (String(error.code || "") === "23505") throw new Error("Ya existe un mesero con ese nombre.");
    throw error;
  }
  return normalizarMesero(data);
}

export async function actualizarMesero(id, cambios = {}) {
  if (!id) throw new Error("Mesero no válido.");
  if (!supabaseConfigOk) throw new Error("Supabase no está configurado.");

  const payload = {};
  if (Object.prototype.hasOwnProperty.call(cambios, "nombre")) {
    payload.nombre = limpiarNombre(cambios.nombre);
    if (!payload.nombre) throw new Error("El nombre del mesero no puede quedar vacío.");
  }
  if (Object.prototype.hasOwnProperty.call(cambios, "activo")) payload.activo = Boolean(cambios.activo);
  if (Object.prototype.hasOwnProperty.call(cambios, "orden")) payload.orden = Number(cambios.orden) || 0;

  const { data, error } = await supabase
    .from("meseros")
    .update(payload)
    .eq("id", id)
    .select("id,nombre,activo,orden,created_at,updated_at")
    .single();

  if (error) {
    if (mensajeSqlPendiente(error)) throw new Error("Ejecuta el SQL de la Fase 39 antes de crear o editar meseros.");
    if (String(error.code || "") === "23505") throw new Error("Ya existe un mesero con ese nombre.");
    throw error;
  }
  return normalizarMesero(data);
}
