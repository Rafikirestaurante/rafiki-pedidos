import { optionsResponse } from "../_shared/cors.ts";
import { randomState, sha256 } from "../_shared/crypto.ts";
import { googleAuthorizationUrl } from "../_shared/google.ts";
import { jsonResponse, mensajeError } from "../_shared/http.ts";
import { requireRafikiAdmin } from "../_shared/supabase.ts";

export default {
  fetch: async (request: Request): Promise<Response> => {
    const preflight = optionsResponse(request);
    if (preflight) return preflight;
    if (request.method !== "POST") return jsonResponse(request, { error: "Método no permitido." }, 405);

    try {
      const { client, user, email } = await requireRafikiAdmin(request);
      const state = randomState();
      const stateHash = await sha256(state);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await client.from("gmail_oauth_states").delete().lt("expires_at", new Date().toISOString());

      await client.from("gmail_oauth_states").delete().not("used_at", "is", null);

      const { error: stateError } = await client.from("gmail_oauth_states").insert({
        state_hash: stateHash,
        user_id: user.id,
        user_email: email,
        expires_at: expiresAt
      });
      if (stateError) throw new Error(`No se pudo preparar la autorización: ${stateError.message}`);

      await client.from("gmail_integration_audit").insert({
        event_type: "oauth_started",
        user_id: user.id,
        user_email: email,
        detail: { expires_at: expiresAt }
      });

      return jsonResponse(request, {
        authorization_url: googleAuthorizationUrl(state),
        expires_at: expiresAt
      });
    } catch (error) {
      return jsonResponse(request, { error: mensajeError(error) }, 403);
    }
  }
};
