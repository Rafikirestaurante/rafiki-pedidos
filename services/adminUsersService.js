import { supabase } from "../supabaseClient";
export async function crearCuentaAdmin(email, password, rol) { const { data, error } = await supabase.functions.invoke("admin-users", { body: { action: "create", email, password, rol } }); if (error) throw error; return data; }
export async function restablecerClaveAdmin(userId, password) { const { data, error } = await supabase.functions.invoke("admin-users", { body: { action: "reset", userId, password } }); if (error) throw error; return data; }
