import { optionsResponse } from "../_shared/cors.ts";
import { jsonResponse, mensajeError } from "../_shared/http.ts";
import { requireRafikiAdmin } from "../_shared/supabase.ts";

export default {
  fetch: async (request: Request): Promise<Response> => {
    const preflight = optionsResponse(request);
    if (preflight) return preflight;
    if (request.method !== "POST" && request.method !== "GET") {
      return jsonResponse(request, { error: "Método no permitido." }, 405);
    }

    try {
      const { client } = await requireRafikiAdmin(request);
      const { data, error } = await client
        .from("gmail_connections")
        .select("google_email,status,connected_at,last_verified_at,last_error,disconnected_at,granted_scope")
        .eq("connection_key", "principal")
        .maybeSingle();

      if (error) throw new Error(`No se pudo consultar la conexión: ${error.message}`);

      return jsonResponse(request, {
        configured: Boolean(data && data.status === "connected"),
        connection: data || null
      });
    } catch (error) {
      return jsonResponse(request, { error: mensajeError(error) }, 403);
    }
  }
};
