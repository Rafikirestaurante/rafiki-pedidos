export const RAFIKI_BUILD = {
  version: '119.7-FASE29F2-SINCRONIZACION-CARTERA-BORRADOS-2026-06-13',
  phase: 'Fase 29F.2 - Sincronización Cartera con Pedidos Borrados',
  date: '2026-06-13',
  fase: '29F.2',
  notes: 'Al borrar un pedido, cartera anula automáticamente el movimiento asociado, recalcula saldos y al abrir Cartera corrige movimientos antiguos de pedidos ya marcados como Borrado.'
};

export const RAFIKI_APP_VERSION = RAFIKI_BUILD.version;
