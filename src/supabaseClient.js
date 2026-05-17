import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabaseConfigOk = Boolean(supabaseUrl && supabaseKey);

// IMPORTANTE:
// createClient() rompe toda la pantalla si las variables no llegan al build de Vercel.
// Por eso usamos valores temporales seguros para que la app SIEMPRE abra y muestre el error,
// en vez de quedarse en blanco.
const urlSegura = supabaseUrl || "https://placeholder.supabase.co";
const keySegura = supabaseKey || "placeholder-anon-key";

export const supabase = createClient(urlSegura, keySegura);
