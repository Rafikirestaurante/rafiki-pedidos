const allowedOrigin = String(Deno.env.get("RAFIKI_APP_URL") || "").replace(/\/$/, "");

export function corsHeaders(request?: Request): Record<string, string> {
  const requestOrigin = request?.headers.get("origin") || "";
  const origin = allowedOrigin && requestOrigin === allowedOrigin ? requestOrigin : allowedOrigin || "null";

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  };
}

export function optionsResponse(request: Request): Response | null {
  if (request.method !== "OPTIONS") return null;
  return new Response("ok", { headers: corsHeaders(request) });
}
