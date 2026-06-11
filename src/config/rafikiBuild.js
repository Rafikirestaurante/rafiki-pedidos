export const RAFIKI_BUILD = {
  version: '26E5-ESTABILIDAD-PEDIDOS-MESAS-TIMEOUT-2026-06-11',
  phase: 'Fase 26E5 - Estabilidad guardado pedidos mesas',
  date: '2026-06-11',
  fase: '26E5',
  notes: 'Se agregan timeouts controlados al guardado de pedidos y al reenvío offline para evitar que /mesas quede pegado en Guardando cuando Supabase o la red móvil no responden.'
};

export const RAFIKI_APP_VERSION = RAFIKI_BUILD.version;
