# Rafiki Pedidos — 119.8

Fase 29F.3 — Auditoría y Sincronización Final de Cartera.

## Cambios principales

- Nuevo botón **Auditar cartera** en `Gerencia > Cartera`.
- Auditoría completa de movimientos de cartera contra la tabla `pedidos`.
- Anula automáticamente movimientos activos cuando el pedido:
  - está en estado `Borrado`,
  - ya no existe,
  - ya no tiene forma de pago `Crédito`.
- Detecta movimientos duplicados para un mismo pedido crédito y anula los duplicados conservando un movimiento principal.
- Ajusta valores y saldos de movimientos contra el total real del pedido y los abonos registrados.
- Recalcula automáticamente `saldo_pendiente`, `total_pedidos` y `fecha_ultimo_pedido` en `clientes_credito`.
- Muestra resumen de la última auditoría: revisados, anulados, borrados, no crédito, huérfanos, duplicados y saldos ajustados.
- No requiere SQL nuevo.

## Recomendación de prueba

1. Abrir `Gerencia > Cartera`.
2. Presionar **Auditar cartera**.
3. Revisar que pedidos borrados o pedidos que ya no son crédito no aparezcan como cartera pendiente.
4. Revisar saldos de clientes crédito.
