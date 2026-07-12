# Fase 35B.4 — Resumen del pedido limpio y edición de proteína

Base: `126.7-FASE35B3-CLIENTE-BETA-VISUAL-MODALES-2026-07-09.zip`

## Objetivo

Mejorar la presentación del **Resumen del pedido** para que sea más fácil de revisar en operación y en cliente público, aplicando el mismo criterio visual en:

- `/cliente`
- `/mesas`
- `/cliente-beta`
- `/mesas-beta`

## Cambios principales

1. **Acompañantes más legibles**
   - Los acompañantes ya no se muestran separados por comas.
   - Ahora aparecen uno debajo del otro.
   - Esto facilita verificar rápidamente si el almuerzo quedó correcto.

2. **Resumen más limpio**
   - Se retiraron textos tipo `Categoría: platos`, `Categoría: sopas`, `Categoría: Cafetería`.
   - Se retiraron etiquetas visibles como `Base:` en el resumen.
   - Los valores siguen existiendo internamente; solo se limpia la presentación.

3. **Plato principal más destacado**
   - El nombre del plato/proteína queda con una jerarquía visual más clara.
   - Los acompañantes quedan con menor peso visual para diferenciarlos de forma sutil.

4. **Botón Borrar más discreto**
   - Se mantiene en color rojo.
   - Se redujo tamaño y peso visual para que no compita con el pedido.

5. **Acciones divididas en dos columnas**
   - `Editar proteína`
   - `Editar acompañantes`

6. **Nuevo modal para editar proteína/plato**
   - Se agregó `EditarProteinaResumenModal.jsx`.
   - Permite cambiar la proteína o plato desde el resumen, sin regresar al flujo inicial.
   - Si el producto está agrupado, el cambio aplica a todo el grupo.
   - Si el nuevo producto no maneja acompañantes, se limpian los acompañantes del grupo.

## Archivos modificados

- `src/shared/components/EditarProteinaResumenModal.jsx`
- `src/modules/cliente/components/PedidoCliente.jsx`
- `src/modules/mesas/components/PanelMesas.jsx`
- `src/modules/cliente/components/PanelClienteBeta.jsx`
- `src/modules/mesas/components/PanelMesasBeta.jsx`
- `src/styles/appStyles.js`
- `src/App.jsx`
- `src/config/rafikiBuild.js`
- `public/rafiki-version.json`

## Validación

- `npm run build` ejecutado correctamente.
- ESLint ejecutado sobre los archivos modificados sin errores; solo permanecen advertencias preexistentes de configuración/uso no detectado.

## Alcance

No se modificó SQL, Caja, Cartera, Pedidos Hoy, impresión térmica, service worker ni reglas PWA.
