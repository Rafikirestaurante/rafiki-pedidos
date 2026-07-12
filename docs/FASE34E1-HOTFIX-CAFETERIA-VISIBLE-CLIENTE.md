# Fase 34E.1 - Hotfix Cafetería visible para cliente especial

## Problema detectado

En la Fase 34E la regla de cafetería para clientes especiales podía quedar poco visible o no mostrar productos esperados porque:

1. La sección se renderizaba después del flujo principal de almuerzos, demasiado abajo para el cliente.
2. El componente usaba solo el catálogo fallback local, no el catálogo dinámico almacenado/cargado desde Supabase como hace `/mesas`.
3. El resumen del pedido estaba preparado para `plato/proteina`; se reforzó para admitir también `producto`.

## Corrección

- La sección `☕ Cafetería habilitada para cliente especial` ahora aparece inmediatamente después del código especial y antes de `Arma tu pedido paso a paso`.
- El componente `CafeteriaClienteEspecial` lee primero el catálogo local `rafiki_catalogo_productos_v1` y luego intenta actualizar desde Supabase con `cargarCatalogoProductosAdmin`.
- Si Supabase falla, conserva fallback/localStorage para no bloquear el pedido público.
- Se muestran productos activos, no agotados, de línea Cafetería y con precio mayor a cero.
- Al agregar un producto de cafetería, aparece mensaje de confirmación y se hace scroll al producto agregado.
- El resumen admite items por `producto`, además de `plato` y `proteina`.

## Alcance

Solo afecta `/cliente` para clientes especiales con código válido. No modifica `/mesas`, Caja, Cartera ni Pedidos Hoy.
