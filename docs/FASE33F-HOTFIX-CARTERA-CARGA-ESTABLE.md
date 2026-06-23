# Fase 33F — Hotfix Cartera carga estable

## Objetivo

Corregir el bloqueo visual del módulo **Cartera**, donde el botón principal podía quedarse permanentemente en **“Actualizando...”** al intentar consultar la cartera del día o abrir el panel.

## Problema detectado

El panel ejecutaba la sincronización completa de cartera durante la carga normal de movimientos. Esa auditoría es útil, pero puede ser pesada porque revisa movimientos, pedidos asociados, anulaciones y recalcula clientes. Si una consulta tardaba demasiado o fallaba sin liberar el estado de carga, el panel quedaba visualmente bloqueado.

También había cargas sin bloque `try/catch/finally` en clientes y abonos, por lo que un error puntual podía dejar activo el estado de carga.

## Cambios aplicados

- La carga normal de Cartera ahora solo consulta clientes, movimientos y abonos.
- La sincronización/auditoría completa queda reservada para el botón **Auditar cartera**.
- Se agregaron bloques `try/catch/finally` en:
  - carga de clientes crédito,
  - carga de movimientos de cartera,
  - carga de abonos.
- Se agregó tiempo máximo de espera para evitar que el panel se quede indefinidamente en **Actualizando...**.
- El botón **Actualizar cartera** usa `Promise.allSettled`, permitiendo que una consulta parcial no bloquee todo el panel.
- Si una consulta falla o tarda demasiado, el panel libera la carga y muestra un mensaje de error entendible.

## Resultado esperado

Al abrir Cartera, el panel debe cargar sin quedarse bloqueado. Para revisar la cartera del día, el usuario puede usar los filtros rápidos de movimientos sin depender de una auditoría completa automática.

La auditoría sigue disponible manualmente desde **Auditar cartera**, pero ya no bloquea la carga diaria normal del módulo.
