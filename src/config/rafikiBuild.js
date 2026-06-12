export const RAFIKI_BUILD = {
  version: '120.0-FASE26G-BASE114-ESTABILIZACION-AUTH-PWA-2026-06-12',
  phase: 'Fase 26G - Estabilización Auth/PWA desde base 114',
  date: '2026-06-12',
  fase: '26G',
  notes: 'Hotfix de estabilización construido sobre la base estable 114. Corrige comparación de versiones PWA tras rollback, endurece persistencia de sesión administrativa y valida sesión Supabase antes de guardar Caja.'
};

export const RAFIKI_APP_VERSION = RAFIKI_BUILD.version;
