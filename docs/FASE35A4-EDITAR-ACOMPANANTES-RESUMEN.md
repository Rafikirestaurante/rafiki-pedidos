# Fase 35A.4 — Editar acompañantes desde Resumen del pedido

Fecha: 2026-07-08  
Versión: `126.4-FASE35A4-EDITAR-ACOMPANANTES-RESUMEN-2026-07-08`

## Objetivo

Permitir que el usuario pueda corregir los acompañantes directamente desde el **Resumen del pedido** en `/cliente` y `/mesas`, sin tener que regresar manualmente al paso anterior del flujo.

## Cambios realizados

### 1. Modal reutilizable para editar acompañantes

Se creó el componente compartido:

- `src/shared/components/EditarAcompanantesResumenModal.jsx`

Este modal muestra:

- Nombre del producto.
- Cantidad agrupada del producto.
- Acompañantes disponibles del menú del día.
- Acompañantes actualmente seleccionados.
- Contador de acompañantes seleccionados.
- Observación sobre acompañantes.
- Botones **Cancelar** y **Guardar cambios**.

### 2. Integración en `/cliente`

En el resumen público del cliente se agregó el botón discreto **Editar acompañantes** para productos de restaurante que sí manejan acompañantes.

Reglas conservadas:

- No aparece para Cafetería.
- No aparece para Pastas, Arroces, Sopas u otros productos marcados como sin selección manual de acompañantes.
- Se mantiene el máximo de acompañantes definido por Rafiki.
- En cliente normal se exige mínimo de 2 acompañantes al guardar desde el modal.
- En cliente especial con regla sin restricción de acompañantes, el mínimo no se exige.
- No se tocó la regla de `/cliente` para llevar por defecto.

### 3. Integración en `/mesas`

En el resumen operativo de `/mesas` también se agregó el botón **Editar acompañantes** en productos de restaurante con acompañantes manuales.

Reglas conservadas:

- No aplica para Cafetería.
- No aplica para productos que vienen con acompañantes del día.
- Se conserva el máximo de acompañantes.
- En `/mesas` no se fuerza mínimo, para no cambiar la operación interna actual.
- Se incluye la opción “Con todo”, respetando la lógica existente del panel de mesas.

### 4. Comportamiento con productos agrupados

Si el resumen muestra un producto agrupado, por ejemplo `3 x Pechuga`, el modal informa que el cambio aplica a todas las unidades del grupo.

Al guardar:

- Se actualizan los acompañantes del grupo completo.
- Se actualiza también la observación de acompañantes.
- El resumen se recalcula automáticamente.
- La agrupación puede mantenerse o separarse según coincidan los nuevos acompañantes con otros productos.

## Archivos modificados

- `src/App.jsx`
- `src/modules/cliente/components/PedidoCliente.jsx`
- `src/modules/mesas/components/PanelMesas.jsx`
- `src/shared/components/EditarAcompanantesResumenModal.jsx`
- `src/styles/appStyles.js`
- `src/config/rafikiBuild.js`
- `public/rafiki-version.json`
- `README.md`

## Áreas no modificadas

No se modificaron:

- SQL.
- Caja.
- Cartera.
- Pedidos Hoy.
- Informes térmicos.
- Clientes especiales en catálogo.
- Service worker.
- PWA de `/mesas` o `/admin`.
- Lógica pública/PWA de `/cliente`.
- Guardado financiero.
