import { optionsResponse } from "../_shared/cors.ts";
import { decryptSecret } from "../_shared/crypto.ts";
import { revokeGoogleToken } from "../_shared/google.ts";
import { jsonResponse, mensajeError } from "../_shared/http.ts";
import { requireRafikiAdmin } from "../_shared/supabase.ts";

export default {
  fetch: async (request: Request): Promise<Response> => {
    const preflight = optionsResponse(request);
    if (preflight) return preflight;
    if (request.method !== "POST") return jsonResponse(request, { error: "Método no permitido." }, 405);

    try {
      const { client, user, email } = await requireRafikiAdmin(request);
      const { data: connection, error } = await client
        .from("gmail_connections")
        .select("google_email,refresh_token_ciphertext,refresh_token_iv")
        .eq("connection_key", "principal")
        .maybeSingle();

      if (error) throw new Error(`No se pudo consultar la conexión: ${error.message}`);
      if (!connection) return jsonResponse(request, { ok: true, already_disconnected: true });

      let revokeWarning = "";
      if (connection.refresh_token_ciphertext && connection.refresh_token_iv) {
        try {
          const refreshToken = await decryptSecret(
            connection.refresh_token_ciphertext,
            connection.refresh_token_iv
          );
          await revokeGoogleToken(refreshToken);
        } catch (revokeError) {
          revokeWarning = mensajeError(revokeError);
        }
      }

      const disconnectedAt = new Date().toISOString();
      const { error: updateError } = await client
        .from("gmail_connections")
        .update({
          status: "disconnected",
          refresh_token_ciphertext: null,
          refresh_token_iv: null,
          disconnected_at: disconnectedAt,
          last_error: revokeWarning || null
        })
        .eq("connection_key", "principal");
      if (updateError) throw new Error(`No se pudo desconectar la cuenta: ${updateError.message}`);

      await client.from("gmail_integration_audit").insert({
        event_type: "oauth_disconnected",
        user_id: user.id,
        user_email: email,
        google_email: connection.google_email,
        detail: revokeWarning ? { warning: revokeWarning } : {}
      });

      return jsonResponse(request, {
        ok: true,
        disconnected_at: disconnectedAt,
        warning: revokeWarning || null
      });
    } catch (error) {
      return jsonResponse(request, { error: mensajeError(error) }, 400);
    }
  }
};
