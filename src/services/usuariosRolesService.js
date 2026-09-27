import { supabase } from "../supabaseClient";

export async function listarUsuariosRoles() {
  const { data, error } = await supabase.from("usuarios_roles").select("id, user_id, email, rol, activo, creado_en, actualizado_en").order("email", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function actualizarRolUsuario(id, rol) {
  const { data, error } = await supabase.from("usuarios_roles").update({ rol }).eq("id", id).select("id, user_id, email, rol, activo").single();
  if (error) throw error;
  return data;
}

export async function actualizarEstadoUsuario(id, activo) {
  const { data, error } = await supabase.from("usuarios_roles").update({ activo }).eq("id", id).select("id, user_id, email, rol, activo").single();
  if (error) throw error;
  return data;
}
