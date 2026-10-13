import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const auth = req.headers.get("Authorization"); if (!auth) throw new Error("No autenticado");
    const url = Deno.env.get("SUPABASE_URL")!, anon = Deno.env.get("SUPABASE_ANON_KEY")!, service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const caller = createClient(url, anon, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await caller.auth.getUser(); if (!user) throw new Error("Sesión inválida");
    const { data: rol } = await caller.from("usuarios_roles").select("rol, activo").eq("email", user.email).maybeSingle();
    if (rol?.activo === false || rol?.rol !== "admin") throw new Error("Solo un administrador puede gestionar cuentas");
    const admin = createClient(url, service); const body = await req.json();
    if (body.action === "create") { const { data, error } = await admin.auth.admin.createUser({ email: body.email, password: body.password, email_confirm: true, user_metadata: { rol: body.rol || "usuario" } }); if (error) throw error; await admin.from("usuarios_roles").upsert({ email: body.email.toLowerCase(), rol: body.rol || "usuario", activo: true }, { onConflict: "email" }); return Response.json({ user: data.user }, { headers: cors }); }
    if (body.action === "reset") { const { error } = await admin.auth.admin.updateUserById(body.userId, { password: body.password }); if (error) throw error; return Response.json({ ok: true }, { headers: cors }); }
    throw new Error("Acción no válida");
  } catch (e) { return Response.json({ error: e.message || "Error administrativo" }, { status: 400, headers: cors }); }
});
