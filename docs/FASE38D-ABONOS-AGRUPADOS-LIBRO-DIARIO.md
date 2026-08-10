# Fase 38D — Abonos agrupados como libro diario

- El Estado de cuenta muestra una sola fila por pago recibido.
- La aplicación FIFO del abono a varios pedidos continúa intacta en Supabase.
- La referencia visible del pago es `Abono`, sin repetir números de pedidos.
- El valor total del pago se descuenta una sola vez del saldo cronológico.
- La exportación de abonos también consolida las aplicaciones internas del mismo pago.
- No se modifican RPC, saldos almacenados, auditoría ni reglas financieras.
