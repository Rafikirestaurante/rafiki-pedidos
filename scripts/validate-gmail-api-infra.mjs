import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
let failures = 0;

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function exists(relativePath, label) {
  const ok = fs.existsSync(path.join(root, relativePath));
  console.log(`${ok ? "✅" : "❌"} ${label}`);
  if (!ok) failures += 1;
}

function contains(relativePath, pattern, label) {
  const content = read(relativePath);
  const ok = pattern.test(content);
  console.log(`${ok ? "✅" : "❌"} ${label}`);
  if (!ok) failures += 1;
}

const files = [
  "supabase/2026-07-11-fase36a-gmail-api-infraestructura.sql",
  "supabase/config.toml",
  "supabase/functions/gmail-oauth-start/index.ts",
  "supabase/functions/gmail-oauth-callback/index.ts",
  "supabase/functions/gmail-connection-status/index.ts",
  "supabase/functions/gmail-test-connection/index.ts",
  "supabase/functions/gmail-disconnect/index.ts",
  "src/services/gmailIntegracionService.js",
  "src/modules/documentos/components/ConsignacionesFacturasAdmin.jsx",
  "docs/FASE36A-INFRAESTRUCTURA-GMAIL-API-SUPABASE.md"
];

for (const file of files) exists(file, file);

contains(
  "src/config/rafikiBuild.js",
  /127\.0-FASE36A-INFRAESTRUCTURA-GMAIL-API-SUPABASE/,
  "versión 127.0 configurada"
);
contains(
  "supabase/2026-07-11-fase36a-gmail-api-infraestructura.sql",
  /refresh_token_ciphertext/,
  "refresh token se almacena cifrado"
);
contains(
  "supabase/2026-07-11-fase36a-gmail-api-infraestructura.sql",
  /revoke all on table public\.gmail_connections from anon, authenticated/,
  "tabla secreta no expuesta a React"
);
contains("supabase/functions/_shared/crypto.ts", /AES-GCM/, "cifrado AES-GCM habilitado");
contains("supabase/functions/_shared/google.ts", /gmail\.readonly/, "alcance Gmail de solo lectura");
contains(
  "supabase/functions/gmail-oauth-start/index.ts",
  /expiresAt.*10 \* 60 \* 1000/s,
  "state OAuth vence en 10 minutos"
);
contains(
  "supabase/functions/gmail-oauth-callback/index.ts",
  /\.is\("used_at", null\)/,
  "state OAuth es de un solo uso"
);
contains(
  "src/modules/gerencia/components/GerenciaPanel.jsx",
  /Consignaciones y facturas/,
  "módulo visible en Gerencia"
);
contains(
  "src/modules/documentos/components/ConsignacionesFacturasAdmin.jsx",
  /no escanea ni registra correos/i,
  "alcance 36A informado en pantalla"
);

if (failures > 0) {
  console.error(`\nFallaron ${failures} validaciones de Fase 36A.`);
  process.exit(1);
}

console.log("\n✅ Infraestructura Gmail API Fase 36A validada.");
