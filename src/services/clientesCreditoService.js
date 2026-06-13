import { supabase, supabaseConfigOk } from "../supabaseClient";

function limpiarTexto(valor) {
  return String(valor || "").trim().replace(/\s+/g, " ");
}

export function normalizarNombreClienteCredito(nombre) {
  return limpiarTexto(nombre);
}

export async function listarClientesCreditoActivos() {
  if (!supabaseConfigOk) return [];

  const { data, error } = await supabase
    .from("clientes_credito")
    .select("id,nombre,alias,activo")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (error) {
    console.warn("No se pudieron cargar clientes de crédito:", error.message);
    return [];
  }

  return Array.isArray(data) ? data : [];
}

export async function asegurarClienteCredito(nombre) {
  const nombreLimpio = normalizarNombreClienteCredito(nombre);
  if (!nombreLimpio || !supabaseConfigOk) return null;

  const { data: existente, error: errorBusqueda } = await supabase
    .from("clientes_credito")
    .select("id,nombre,alias,activo")
    .ilike("nombre", nombreLimpio)
    .maybeSingle();

  if (!errorBusqueda && existente?.id) return existente;

  const { data, error } = await supabase
    .from("clientes_credito")
    .insert({ nombre: nombreLimpio, activo: true })
    .select("id,nombre,alias,activo")
    .single();

  if (error) {
    console.warn("No se pudo registrar cliente de crédito:", error.message);
    return null;
  }

  return data;
}
