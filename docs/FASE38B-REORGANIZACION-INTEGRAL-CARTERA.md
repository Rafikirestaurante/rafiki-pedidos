# Fase 38B — Reorganización integral de Cartera

Versión 127.20. La interfaz de Cartera queda organizada en dos vistas principales: **Cartera actual** e **Historial**. El antiguo Detalle cliente deja de ser una pestaña y pasa a abrirse como Estado de cuenta desde cada cliente.

El Estado de cuenta reúne cronológicamente los pedidos a crédito y los pagos recibidos, con las columnas Fecha, Movimiento, Referencia, Descripción, Pedido a crédito, Pago recibido y Saldo pendiente. La descripción conserva el resumen real de productos incorporado en 38A.

Se simplifican los indicadores operativos y se agregan exportaciones independientes para Cartera actual, pedidos filtrados del Historial, abonos filtrados y Estado de cuenta individual. Las exportaciones respetan los filtros visibles aplicables.

No se modifican la persistencia, los RPC transaccionales, la aplicación FIFO de abonos, el cálculo de saldos, los valores monetarios enteros, la auditoría ni las reglas de sincronización financiera.
