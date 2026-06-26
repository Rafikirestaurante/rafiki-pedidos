# Fase 34D.2 — Hotfix /cliente público sin mezcla PWA

## Objetivo

Corregir la aclaración operativa de Fase 34D.1: la ruta `/cliente` es un link público para clientes y no debe tratarse como ruta interna de PWA.

## Cambios aplicados

- Se mantiene visible el recuadro `⭐ ¿Tienes código de cliente?` al inicio de `/cliente`.
- Se quitó `/cliente` de `esRutaInternaPWA()` para que no se considere página interna instalable.
- Se actualizó la versión y las notas para evitar confundir el flujo público con la PWA interna.

## No se modificó

- `src/modules/mesas`
- `src/modules/caja`
- `src/modules/cartera`
- `src/services/pedidosService.js`
- `src/shared/hooks/usePedidos.js`

## Regla de trabajo desde esta fase

`/cliente` se maneja como experiencia web pública mediante link. La PWA queda enfocada en rutas internas/operativas como `/mesas`, `/admin`, `/pedidos` y `/gerencia`.

## Versión

124.32-HOTFIX34D2-CLIENTE-LINK-PUBLICO-SIN-PWA-2026-06-26
