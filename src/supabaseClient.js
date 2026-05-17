import { createClient } from "@supabase/supabase-js";

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || "").trim();
const supabaseKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

export const supabaseConfigOk = Boolean(supabaseUrl && supabaseKey);
export const supabaseConfigMensaje =
  "Faltan variables de Supabase. Revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Vercel y vuelve a desplegar sin caché.";

function crearClienteSupabaseSeguro() {
  if (supabaseConfigOk) {
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  console.error(supabaseConfigMensaje);

  // Cliente de respaldo solo para que React no quede en blanco si faltan variables.
  // La app muestra un error claro y evita consultas reales mientras supabaseConfigOk sea false.
  return createClient("https://rafiki-config-incompleta.supabase.co", "rafiki-config-incompleta", {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export const supabase = crearClienteSupabaseSeguro();
