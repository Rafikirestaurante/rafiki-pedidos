# Fase 35D — Gastos y Cartera térmico

Versión: `125.3-FASE35D-GASTOS-CARTERA-TERMICO-2026-07-01`

## Objetivo

Agregar impresión térmica administrativa para `Gastos Diarios` y `Cartera`, manteniendo la regla definida para Fase 35:

- 58 mm y 80 mm imprimen la misma información.
- La diferencia entre formatos es únicamente visual: ancho, compactación, saltos de línea y tamaño.
- No se crea una versión reducida para 58 mm.

## Gastos Diarios

Se agregaron botones en el informe de gastos:

- `Imprimir 58 mm`
- `Imprimir 80 mm`

El informe térmico incluye:

- Fecha de impresión.
- Fecha del informe.
- Cantidad de gastos registrados.
- Total de gastos del día.
- Resumen por categoría.
- Resumen por método de pago.
- Detalle de gastos: proveedor, valor, categoría, método de pago, factura y detalle/observación.

## Cartera

Se agregaron dos tipos de impresión:

### Resumen de Cartera

Botones superiores:

- `Resumen 58 mm`
- `Resumen 80 mm`

Incluye:

- Créditos otorgados hoy.
- Abonos recibidos hoy.
- Cartera pendiente total.
- Clientes con saldo.
- Pedidos pendientes.
- Abonos acumulados.
- Cantidad de abonos.
- Saldo según filtros.
- Abonos por método.
- Top saldos pendientes.

### Movimientos de Cartera

Botones en la vista `Movimientos`:

- `Imprimir 58 mm`
- `Imprimir 80 mm`

Incluye exactamente los movimientos filtrados visibles por:

- Cliente.
- Estado.
- Rango de fechas.
- Texto de búsqueda.

También imprime:

- Cantidad de movimientos.
- Valor filtrado.
- Saldo filtrado.
- Resumen por estado.
- Detalle de cada movimiento: fecha, pedido, cliente, pedido realizado, valor, estado y saldo.

## Alcance seguro

No se modificó:

- `/cliente`
- `/mesas`
- Pedidos Hoy
- Caja
- Dashboard
- SQL
- Guardado de pedidos
- Impresión de comandas o tickets

## Validación

Se agregó el script:

```bash
npm run thermal-gastos-cartera:check
```

También se recomienda ejecutar:

```bash
npm run thermal-reports:check
npm run thermal-pedidos-hoy:check
npm run thermal-caja:check
npm run pwa:check
npm run build
npm run lint
```
