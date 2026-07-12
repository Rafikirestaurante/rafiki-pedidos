import { createClient, type SupabaseClient, type User } from "npm:@supabase/supabase-js@2.106.2";
import { requiredEnv } from "./env.ts";

export function adminClient(): SupabaseClient {
  return createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export type AdminContext = {
  client: SupabaseClient;
  user: User;
  email: string;
};

export async function requireRafikiAdmin(request: Request): Promise<AdminContext> {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!token) throw new Error("Sesión administrativa no encontrada.");

  const client = adminClient();
  const { data: userData, error: userError } = await client.auth.getUser(token);
  if (userError || !userData.user) {
    throw new Error("La sesión administrativa venció. Inicia sesión nuevamente.");
  }

  const email = String(userData.user.email || "")
    .trim()
    .toLowerCase();
  if (!email) throw new Error("El usuario autenticado no tiene correo válido.");

  const { data: roleData, error: roleError } = await client
    .from("usuarios_roles")
    .select("rol")
    .ilike("email", email)
    .limit(1)
    .maybeSingle();

  if (roleError) throw new Error(`No se pudo validar el rol administrativo: ${roleError.message}`);
  if (String(roleData?.rol || "").toLowerCase() !== "admin") {
    throw new Error("Solo el rol Administrador puede configurar la conexión con Gmail.");
  }

  return { client, user: userData.user, email };
}
