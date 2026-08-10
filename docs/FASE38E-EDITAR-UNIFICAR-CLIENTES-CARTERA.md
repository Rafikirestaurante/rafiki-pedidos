# Fase 38E — Editar y unificar clientes de cartera

Versión 127.23, basada en 127.22.

## Uso

En **Gerencia → Cartera → Cartera actual**, el menú de cada cliente conserva **Editar cliente** y agrega **Unificar con otro cliente**.

La edición corrige nombre, teléfono u observaciones del mismo registro. La unificación se utiliza cuando existen dos registros para una sola persona: se elige el duplicado, se selecciona el cliente principal y se confirma el resumen mostrado por Rafiki.

## Alcance de la unificación

- Traslada movimientos de cartera y abonos al cliente principal.
- Recalcula total de pedidos, saldo pendiente y fecha del último pedido.
- Cambia el nombre en todos los pedidos históricos asociados al duplicado; la corrección se refleja en Pedidos Hoy, historiales, informes y exportaciones.
- Conserva el nombre anterior como alias de búsqueda.
- Conserva el teléfono del cliente principal; si está vacío, toma el del duplicado.
- Combina observaciones y deja constancia del nombre unificado.
- Elimina el registro duplicado al final de la misma transacción.

La operación no modifica productos, cantidades, valores, fechas, estados, métodos de pago ni números de pedido.

## Paso requerido en Supabase

Antes de utilizar la nueva acción, ejecutar una sola vez:

`supabase/2026-08-05-fase38e-editar-unificar-clientes-cartera.sql`

La función SQL realiza toda la unificación de forma transaccional: si algún paso falla, no deja una combinación incompleta.
