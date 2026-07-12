# Fase 35B.2 — Mesas Beta con resumen permanente

Base: `126.5-FASE35B1-MESAS-BETA-VISUAL-MODALES-2026-07-09.zip`.

## Objetivo

Corregir la primera versión de `/mesas-beta` para que el flujo no duplique el resumen en dos lugares y permita agregar varios almuerzos desde el mismo resumen.

## Cambios realizados

- Se eliminó el paso modal 4 `Resumen del pedido`.
- El flujo beta queda con tres ventanas modales:
  1. Selecciona tu proteína aquí.
  2. Selecciona tu acompañante.
  3. Datos de mesa.
- El `Resumen del pedido` queda como panel permanente visible en la pantalla beta.
- El resumen permanente conserva las mejoras de fases anteriores:
  - agrupación automática de productos iguales,
  - edición de cantidad,
  - edición de acompañantes desde modal,
  - borrado por grupo,
  - subtotal por producto,
  - total visual.
- Se agregó el botón `+ Agregar otro almuerzo` directamente en el resumen permanente.
- Al finalizar datos de mesa, el modal se cierra y el usuario queda viendo el resumen sin abrir otro paso.

## Seguridad

- `/mesas-beta` continúa siendo solo visual.
- No guarda pedidos.
- No imprime.
- No envía a cocina.
- No toca Supabase.
- No modifica `/mesas` oficial.
- No modifica `/cliente`.
- No afecta Caja, Cartera, Pedidos Hoy, SQL ni service worker/PWA.

## Validación

- `npm run build` ejecutado correctamente.
- ESLint sobre `PanelMesasBeta.jsx` no mostró errores, solo advertencias preexistentes/esperadas por configuración del proyecto.
