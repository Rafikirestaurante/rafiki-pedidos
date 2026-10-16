# 125.6 — Hotfix 35E.2 Tablas térmicas compactas

## Objetivo

Corregir la impresión térmica de informes para optimizar espacio en impresoras de 58 mm y 80 mm.

## Regla aplicada

Los reportes de listados deben imprimirse en formato de tabla compacta, no como bloques largos.

En **Pedidos Hoy** el listado queda con columnas:

```text
Pedido | Cliente | Ubicación | Total
```

## Cambios principales

- Se agregó modo `tabla` al motor central `thermalReportService.js`.
- Se conserva el modo anterior por bloques para reportes que lo necesiten.
- Pedidos Hoy imprime el listado en tabla compacta.
- Gastos imprime el detalle en tabla compacta: proveedor, categoría, pago y valor.
- Cartera imprime top saldos y movimientos en tabla compacta.
- Se mantienen resúmenes y filtros, pero los listados ya no imprimen detalles largos.

## Información 58 mm / 80 mm

La información sigue siendo la misma en ambos formatos. La diferencia es únicamente visual: ancho, ajuste de columnas y saltos de línea.

## No se tocó

- `/cliente`
- `/mesas`
- Caja cálculos
- Cartera cálculos
- SQL
- Guardado de pedidos
- Impresión de comandas o tickets

## Validación

Se agregó:

```bash
npm run thermal-tabla:check
```
