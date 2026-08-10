# Fase 36B.6 — Modularización progresiva

Versión: `127.6-FASE36B6-MODULARIZACION-PROGRESIVA-2026-07-21`

## Objetivo

Reducir la concentración de responsabilidades dentro de los archivos más grandes de Rafiki Pedidos sin reescribir la aplicación ni modificar flujos operativos.

## Cambios

- El registro de componentes cargados bajo demanda sale de `App.jsx` y queda en `src/app/lazyModules.js`.
- Las utilidades visuales y de transformación de Cartera se trasladan a `src/modules/cartera/utils/carteraViewUtils.js`.
- Los formularios y confirmaciones de Cartera se trasladan a `CarteraModals.jsx`.
- Las reglas visuales del Generador de menú se trasladan a `generadorMenuViewUtils.js`.
- La lectura, almacenamiento y filtrado del catálogo de Mesas se traslada a `catalogoMesas.js`.
- Los estilos internos de Cartera, Generador de menú, Catálogo, Gastos e Inventario pasan a archivos CSS propios por módulo.
- Se agregan pruebas unitarias específicas para los nuevos módulos extraídos.
- Se incorpora `npm run modularization:check` al control integral.

## Límites automáticos

El validador impide que `App.jsx`, Cartera, Generador de menú y Panel Mesas vuelvan a superar los límites definidos sin una revisión explícita.

## Alcance

No se modifican Supabase, SQL, permisos, cálculos financieros, rutas, PWA, impresión térmica, diseño visible ni comportamiento de pedidos.
