export const RAFIKI_BUILD = {
  version: "127.18-FASE37F-CONTROL-INSUMOS-AM-PM-2026-08-05",
  phase: "Fase 37F - Control de solicitudes de insumos por jornada",
  date: "2026-08-05",
  fase: "37F-CONTROL-INSUMOS-AM-PM",
  notes:
    "En Solicitud de insumos, cada producto puede solicitarse una vez en AM y una vez en PM. Los repetidos de la misma jornada se omiten y los de la jornada contraria requieren confirmación antes de guardarse y enviarse por WhatsApp.",
};

export const RAFIKI_APP_VERSION = RAFIKI_BUILD.version;
