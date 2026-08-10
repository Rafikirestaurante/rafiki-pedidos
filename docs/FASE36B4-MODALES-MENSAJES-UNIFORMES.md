# Fase 36B.4 — Modales y mensajes uniformes

Versión: `127.4-FASE36B4-MODALES-MENSAJES-UNIFORMES-2026-07-21`

## Objetivo

Unificar la forma en que Rafiki confirma acciones importantes y comunica sus resultados, eliminando las ventanas nativas que cambian según el navegador.

## Criterio aplicado

- **Modal Rafiki:** decisiones críticas, acciones irreversibles y errores que requieren intervención.
- **Aviso breve:** guardados, actualizaciones, respaldos locales y advertencias cotidianas.
- **Mensaje en formulario:** validaciones relacionadas con un campo o dato específico.
- **Estado de proceso:** botones bloqueados con textos como `Guardando...` o `Actualizando...`.

## Cobertura

- Gastos: confirmación de eliminación y resultados de guardado, edición o borrado.
- Catálogo: confirmación al ocultar registros y restaurar la base; resultados de cambios locales o Supabase.
- PWA: confirmación antes de limpiar caché y aviso si la limpieza es parcial.
- Impresión: modal uniforme cuando el navegador bloquea ventanas emergentes en Caja, Pedidos Hoy y tickets individuales.

## Validación

```bash
npm run feedback:check
npm run check
```

El validador falla si detecta `window.alert`, `window.confirm`, `alert()` o `confirm()` dentro de `src`.

No se agregaron migraciones SQL ni se modificó la lógica de negocio.
