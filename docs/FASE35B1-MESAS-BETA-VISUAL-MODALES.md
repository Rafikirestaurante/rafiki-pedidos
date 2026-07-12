# Fase 35B.1 — Mesas Beta visual por modales

Base: `126.4-FASE35A4-EDITAR-ACOMPANANTES-RESUMEN-2026-07-08.zip`.

## Objetivo

Crear una ruta paralela `/mesas-beta` para probar un nuevo flujo visual de almuerzos sin afectar la operación oficial de `/mesas`.

## Alcance

- Se agrega `PanelMesasBeta.jsx` como componente independiente.
- Se habilita la ruta `/mesas-beta` desde el router manual de la app.
- La beta usa menú real del día y platos agrupados existentes.
- El flujo se presenta en ventanas modales, en este orden:
  1. Selecciona tu proteína aquí.
  2. Selecciona tu acompañante.
  3. Datos de mesa.
  4. Resumen del pedido.
- El resumen conserva mejoras recientes:
  - agrupación automática de productos iguales;
  - edición de cantidad;
  - edición de acompañantes mediante modal;
  - total visual recalculado.

## Seguridad operativa

Esta fase es solo visual:

- No guarda pedidos.
- No imprime.
- No envía a cocina.
- No toca Supabase.
- No afecta Caja, Cartera, Pedidos Hoy ni reportes.
- No modifica `/cliente`.
- No reemplaza `/mesas` oficial.

## Archivos modificados

- `src/App.jsx`
- `src/shared/utils/navigation.js`
- `src/styles/appStyles.js`
- `src/config/rafikiBuild.js`
- `public/rafiki-version.json`
- `README.md`

## Archivos nuevos

- `src/modules/mesas/components/PanelMesasBeta.jsx`
- `docs/FASE35B1-MESAS-BETA-VISUAL-MODALES.md`
