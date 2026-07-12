# Fase 35B.5 — Resumen del pedido estilo final

Versión: `126.9-FASE35B5-RESUMEN-PEDIDO-ESTILO-FINAL-2026-07-10`

## Objetivo

Aplicar de forma uniforme el estilo acordado para el **Resumen del pedido** en:

- `/cliente`
- `/mesas`
- `/cliente-beta`
- `/mesas-beta`

La intención es que el cliente o el operador pueda verificar el pedido de manera más cómoda, clara y rápida antes de finalizar.

## Cambios visuales principales

1. **Almuerzos**
   - El plato/proteína principal queda como título con mayor jerarquía visual.
   - Los acompañantes aparecen uno debajo del otro, con viñeta discreta.
   - Se conserva la separación visual entre plato principal y acompañantes.
   - Se mantienen los botones `Editar proteína` y `Editar acompañantes` en dos columnas.
   - El botón `Borrar` queda rojo, pequeño y discreto.

2. **Cafetería y Parfait**
   - El resumen queda más limpio.
   - Para Parfait, el título principal queda como `Parfait`.
   - Tamaño, frutas y extras se muestran como detalles debajo, sin textos tipo `Categoría:` ni `Base:`.
   - El mismo estilo se aplica a batidos, jugos, desayunos, postres y demás productos de cafetería.

3. **Limpieza general**
   - No se muestran textos como `Categoría: platos`, `Categoría: sopas`, `Categoría: cafetería` ni títulos `Base:` dentro del resumen.
   - Los datos siguen existiendo internamente para cálculo, impresión y guardado; solo se cambió la presentación.

## Archivos modificados

- `src/shared/components/ResumenPedidoItem.jsx`
- `src/modules/mesas/components/PanelMesas.jsx`
- `src/modules/mesas/components/PanelMesasBeta.jsx`
- `src/modules/cliente/components/PanelClienteBeta.jsx`
- `src/styles/appStyles.js`
- `src/config/rafikiBuild.js`
- `public/rafiki-version.json`
- `README.md`

## Alcance seguro

No se modificó:

- SQL
- Caja
- Cartera
- Pedidos Hoy
- Impresión térmica
- Service worker
- Lógica PWA
- Guardado real de `/cliente` o `/mesas`

La beta sigue siendo visual cuando aplica.

## Validación

- `npm run build` pasó correctamente.
- ESLint en archivos modificados no mostró errores; solo advertencias preexistentes/no bloqueantes de imports y configuración.
