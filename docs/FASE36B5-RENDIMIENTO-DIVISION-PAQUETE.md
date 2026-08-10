# Fase 36B.5 — Rendimiento y división del paquete principal

Versión: `127.5-FASE36B5-RENDIMIENTO-DIVISION-PAQUETE-2026-07-21`

## Objetivo

Reducir el peso del JavaScript inicial y evitar que las rutas carguen componentes que todavía no necesitan, conservando exactamente los mismos flujos operativos, permisos, cálculos y diseño.

## Cambios

- Los estilos globales pasan de un template literal JavaScript a `src/styles/app.css`.
- React, Supabase y Workbox quedan en paquetes vendor separados y cacheables.
- Inicio/Login, Pedido Cliente, Confirmación, Cabecera Admin, Pedidos Hoy y Editor de menú se cargan bajo demanda.
- El runtime PWA interno se agrupa en `PWAInternalRuntime.jsx` y no se monta en la ruta pública `/cliente`.
- Se conserva la recuperación de módulos diferidos mediante `lazyConReintento`.
- Se agrega `npm run performance:check`, integrado en `npm run check`.

## Resultado

- Paquete principal anterior: aproximadamente 799.37 KB (212.28 KB gzip).
- Nuevo paquete principal: aproximadamente 166.09 KB (51.24 KB gzip).
- JavaScript inicial separado: aproximadamente 523.42 KB (152.53 KB gzip).
- CSS global: aproximadamente 121.93 KB (21.73 KB gzip).
- Ningún paquete JavaScript supera 240 KB.

No se modifican Supabase, SQL, Caja, Cartera, ventas, gastos, impresión, reglas de pedidos ni permisos.
