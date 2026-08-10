# Fase 38G — Gastos con listado y dashboard separados

Versión: `127.25-FASE38G-GASTOS-LISTADO-DASHBOARD-ORGANIZADO-2026-08-10`

Esta fase corrige la sobrecarga visual introducida en 38F. El panel conserva una sola cabecera operativa y divide el informe en dos subpestañas claramente diferenciadas.

## Listado de gastos

- Es la vista predeterminada.
- Conserva las columnas Proveedor, Valor, Artículos, Categoría, Pago, Factura y Acciones.
- Mantiene la selección de fecha, la edición, la eliminación y la impresión.
- Elimina completamente el control y las tarjetas desplegables de resumen por categoría y método de pago.

## Dashboard de gastos

- Se muestra únicamente al seleccionar su subpestaña.
- Filtra por fecha inicial, fecha final y proveedor.
- Presenta total del periodo, promedio por día con gastos, proveedor con mayor gasto y día con mayor gasto.
- Incluye comparativos separados de gasto por proveedor y gasto por día.
- Exporta los registros correspondientes a los filtros visibles.

No se modifican la estructura de Supabase, los registros existentes ni las reglas financieras.
