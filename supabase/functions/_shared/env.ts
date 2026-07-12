export function requiredEnv(name: string): string {
  const value = String(Deno.env.get(name) || "").trim();
  if (!value) throw new Error(`Falta configurar el secreto ${name}.`);
  return value;
}

export function appRedirectUrl(result: "connected" | "error" | "disconnected", detail = ""): string {
  const appUrl = requiredEnv("RAFIKI_APP_URL").replace(/\/$/, "");
  const url = new URL("/gerencia", appUrl);
  url.searchParams.set("gmail", result);
  if (detail) url.searchParams.set("gmail_detail", detail.slice(0, 180));
  return url.toString();
}
