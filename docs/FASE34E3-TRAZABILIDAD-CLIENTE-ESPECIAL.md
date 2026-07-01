# Fase 34E.3 — Trazabilidad cliente especial en pedido

Versión: `124.43-FASE34E3-TRAZABILIDAD-CLIENTE-ESPECIAL-2026-06-26`

## Objetivo

Blindar el siguiente paso de Clientes Especiales sin tocar `/mesas`: cuando un cliente especial hace un pedido desde `/cliente`, el pedido queda con una referencia interna segura del código usado para permitir promociones, descuentos, regalos o reportes futuros.

## Cambios realizados

- Se creó una normalización central para cliente especial dentro de `src/shared/utils/pedidos.js`.
- Se reemplazó la construcción manual del objeto `cliente_especial` en `usePedidos` por la función compartida `normalizarClienteEspecialParaPedido`.
- Cada item del pedido creado desde `/cliente` mantiene una referencia interna en `item.cliente_especial` con:
  - `id`
  - `codigo`
  - `nombre`
  - reglas aplicadas (`sin_restriccion_acompanantes`, `habilita_cafeteria`, `permite_modificar_datos`)
  - `origen: cliente`
- Se agregó `obtenerClienteEspecialPedido` para leer esa referencia desde un pedido ya creado.
- La pantalla de confirmación de `/cliente` muestra una franja discreta cuando el pedido fue realizado con cliente especial.

## Qué NO se cambió

- No se agregaron columnas nuevas en SQL.
- No se cambió la tabla `pedidos`.
- No se modificó `/mesas`.
- No se modificaron Caja, Cartera, Pedidos Hoy ni Dashboard.
- No se aplicaron descuentos, regalos ni promociones todavía.

## Motivo técnico

Se usa `items[].cliente_especial` porque la tabla `pedidos` ya guarda `items` como JSON estructurado. Esto evita migraciones riesgosas y permite sentar la base para promociones futuras sin romper compatibilidad con pedidos anteriores.

## Pruebas recomendadas

1. Entrar a `/cliente` sin código y hacer un pedido normal.
2. Confirmar que el pedido normal no muestra franja de cliente especial.
3. Entrar a `/cliente` con código especial activo.
4. Agregar un producto de Restaurante.
5. Agregar un producto de Cafetería si el cliente tiene la regla activa.
6. Finalizar el pedido.
7. Confirmar que la pantalla final muestra `⭐ Cliente especial aplicado`.
8. Revisar en Supabase que los items del pedido contienen `cliente_especial`.
9. Confirmar que `/mesas` sigue igual.
