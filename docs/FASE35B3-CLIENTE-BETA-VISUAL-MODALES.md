# Fase 35B.3 — Cliente Beta visual con resumen permanente

## Objetivo

Crear una ruta paralela `/cliente-beta` para probar y socializar un flujo público de cliente basado en la experiencia de `/mesas-beta`, sin afectar la ruta oficial `/cliente` ni guardar pedidos reales.

## Cambios principales

- Nueva ruta visual `/cliente-beta`.
- Nuevo componente `PanelClienteBeta.jsx`.
- Flujo por modales en tres pasos:
  1. Selecciona tu proteína aquí.
  2. Selecciona tu acompañante.
  3. Datos del cliente.
- Se conserva un Resumen del pedido permanente, sin crear un cuarto paso redundante.
- El resumen permite:
  - agrupar productos iguales,
  - editar cantidades,
  - borrar grupos,
  - editar acompañantes desde modal,
  - agregar varios almuerzos,
  - revisar total visual.

## Reglas de cliente público respetadas

- El pedido público queda para llevar por defecto.
- El adicional para llevar se refleja visualmente en el total.
- El pedido solo deja de ser para llevar si se marca explícitamente “comer en restaurante”.
- Se exige mínimo de 2 acompañantes para productos que manejan acompañantes.
- Los productos tipo Pastas, Arroces o Sopas mantienen el mensaje “Este Producto viene con acompañantes del día”.

## Alcance seguro

La beta es solo visual:

- No guarda pedidos.
- No imprime.
- No envía a cocina.
- No toca Supabase.
- No afecta Caja.
- No afecta Cartera.
- No afecta Pedidos Hoy.
- No reemplaza `/cliente` oficial.

## Archivos modificados

- `src/App.jsx`
- `src/shared/utils/navigation.js`
- `src/config/rafikiBuild.js`
- `public/rafiki-version.json`
- `README.md`

## Archivos nuevos

- `src/modules/cliente/components/PanelClienteBeta.jsx`
- `docs/FASE35B3-CLIENTE-BETA-VISUAL-MODALES.md`

## Validación

No se pudo ejecutar `npm run build` en este entorno porque el paquete entregado no incluye `node_modules` y el binario `vite` no está instalado localmente. El ajuste se mantuvo acotado a una ruta nueva y componentes nuevos, sin modificar el flujo oficial de guardado.
