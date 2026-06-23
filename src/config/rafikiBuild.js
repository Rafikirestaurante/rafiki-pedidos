export const RAFIKI_BUILD = {
  version: "123.5-CLIENTE-PARA-LLEVAR-OBLIGATORIO-2026-06-23",
  phase: "Fase 33F - Hotfix cliente para llevar obligatorio",
  date: "2026-06-23",
  fase: "33F-HOTFIX-CLIENTE-PARA-LLEVAR",
  notes:
    "Corrige el flujo público /cliente para que todo pedido externo quede marcado obligatoriamente como para llevar, salvo que el cliente active Comer en el restaurante. Refuerza la regla en la interfaz, en el estado de App.jsx, en el guardado de usePedidos.js y en filtros de Pedidos Hoy."
};

export const RAFIKI_APP_VERSION = RAFIKI_BUILD.version;
