export const RAFIKI_BUILD = {
  version: "123.3-ROOT-CLIENTE-PWA-ADMIN-2026-06-20",
  phase: "Fase 33F - Root público hacia Cliente y PWA obligatoria en Admin",
  date: "2026-06-20",
  fase: "33F-HOTFIX-PWA-ROOT",
  notes:
    "Agrega redirección pública de / hacia /cliente en Vercel y refuerza el arranque de la PWA instalada para que, incluso si fue instalada desde rutas antiguas como /mesas o /cliente, inicie en /admin. Mantiene el control diario de créditos de 123.1 y el manifest interno de 123.2."
};

export const RAFIKI_APP_VERSION = RAFIKI_BUILD.version;
