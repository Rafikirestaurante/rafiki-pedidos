# Fase 36B.7 — Diagnóstico técnico reforzado y resumen de Cafetería

Versión: `127.7-FASE36B7-DIAGNOSTICO-TECNICO-RESUMEN-CAFETERIA-2026-07-21`

## Objetivo

Reforzar el panel de diagnóstico interno y limpiar la presentación del Resumen del pedido exclusivamente para productos de Cafetería pertenecientes a Parfait y Batidos.

## Diagnóstico técnico reforzado

El panel muestra versión instalada y publicada, actualización disponible, conexión, Supabase, Service Worker, cachés PWA, última sincronización, últimos errores, tiempos de carga, recursos lentos y memoria reportada. También permite copiar un informe técnico listo para compartir.

La información de errores y sincronización se conserva únicamente en el almacenamiento local del dispositivo.

## Resumen del pedido

- **Parfait:** una sola línea, por ejemplo `Parfait 12 oz · Frutos rojos, Karibú`.
- **Batidos cremosos y refrescantes:** la selección directa, por ejemplo `Milo 12 oz`, sin repetir el tipo genérico.

No se modifica el resumen de jugos tradicionales, desayunos, bebidas, postres, restaurante ni otras categorías. La regla se aplica en `/cliente`, `/mesas`, `/cliente-beta` y `/mesas-beta` mediante el componente compartido.

## Verificación

`npm run diagnostic:check`, integrado en `npm run check`. Resultado final: 64 pruebas automáticas y 23 controles integrales.
