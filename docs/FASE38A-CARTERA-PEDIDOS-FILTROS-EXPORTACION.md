# Fase 38A — Cartera: pedidos, descripción, filtros y exportación

Base: versión 127.18, cierre oficial de la Fase 37F.

## Cambios

- Se adopta **Pedido** como nombre de la referencia, evitando la denominación contable “Cargo”.
- La columna de contenido pasa a llamarse **Descripción del pedido**.
- El resumen usa un formato natural con cantidad y producto, por ejemplo: `1 Pechuga asada + 2 Carnes bistec`.
- Movimientos incorpora filtros independientes por número de pedido y por producto o descripción.
- La búsqueda general, cliente, estado y rango de fechas se conservan.
- La exportación incluye únicamente los movimientos que cumplen todos los filtros visibles y registra esos filtros en el encabezado del archivo.
- No se modifica la lógica financiera, los saldos, la aplicación FIFO de abonos ni la auditoría de cartera.
