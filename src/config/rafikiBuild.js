export const RAFIKI_BUILD = {
  version: "123.6-HOTFIX-FILTROS-PEDIDOS-HOY-2026-06-23",
  phase: "Fase 33F - Hotfix filtros Pedidos Hoy",
  date: "2026-06-23",
  fase: "33F-HOTFIX-FILTROS-PEDIDOS-HOY",
  notes:
    "Corrige los filtros rápidos de Pedidos Hoy para que Restaurante para llevar incluya pedidos creados desde /cliente y /mesas. La detección ahora usa señales del pedido completo, tipo_pedido, ubicación, mesa y marcas de los ítems."
};

export const RAFIKI_APP_VERSION = RAFIKI_BUILD.version;
