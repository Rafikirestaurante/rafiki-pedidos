# Fase 35A.1 — Ajustes de Informes Rafa y Generador de Menú

Fecha: 2026-07-06  
Base: `125.10-HOTFIX35F3-CONTRASTE-TERMICO-1X1-2026-07-03.zip`

## Objetivo

Aplicar ajustes pequeños y seguros antes de continuar con nuevas mejoras de la Fase 35, sin tocar `/cliente`, `/mesas`, Caja, Cartera ni la lógica PWA pública.

## Cambios realizados

### 1. Informes Rafa

- Se retiró del panel de Informes Rafa el bloque visible **“Cierre diario inteligente”**.
- También se eliminó la acción asociada de guardar cierre diario desde ese bloque, junto con el estado visual de observaciones y confirmación.
- Se mantuvieron intactos los cálculos ya usados por el informe, como ventas, gastos y utilidad aproximada, para no afectar Dashboard ni los informes exportables.

### 2. Generador de menú

- Se eliminó el bloque duplicado **“Informe últimos 12 menús”** de la subpestaña **Generador**.
- El informe quedó disponible únicamente en la subpestaña **Historial de menú**, que es donde tiene más sentido operativo.
- En Historial de menú se agregó un selector discreto para consultar y comparar menús por:
  - **Últimos 12** menús.
  - **Una fecha** específica.
  - **Rango** de fechas.
- El texto generado y compartido por WhatsApp ahora toma el título dinámico según el filtro seleccionado: últimos 12, fecha única o rango.
- Se agregó estilo responsive para que los filtros se acomoden mejor en celular.

## Validaciones

- `npm run build` ejecutado correctamente.
- `npx eslint src/modules/catalogo/components/GeneradorMenu.jsx src/modules/dashboard/components/PanelRafaPrivado.jsx` no reportó errores en los archivos modificados; solo advertencias preexistentes de imports/variables no usadas.
- `npm run lint` global sigue mostrando errores preexistentes en scripts de validación y utilidades no relacionadas con esta fase.

## Archivos modificados

- `src/modules/dashboard/components/PanelRafaPrivado.jsx`
- `src/modules/catalogo/components/GeneradorMenu.jsx`
- `src/config/rafikiBuild.js`
- `public/rafiki-version.json`
- `docs/FASE35A1-AJUSTES-INFORMES-MENU.md`
