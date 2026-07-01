# Hotfix 35E.1 — Pedidos Hoy térmico compacto

## Objetivo

Corregir la impresión térmica de **Pedidos Hoy** para evitar textos largos en impresoras de 58 mm y 80 mm.

## Regla aplicada

El listado de pedidos vuelve al formato compacto:

- Número de pedido
- Cliente
- Ubicación
- Total

No se imprime el detalle largo del pedido, ni línea, ni pago/estado dentro del listado.

## Qué se mantiene

- Selector global 58 mm / 80 mm.
- Misma información en ambos formatos.
- Optimización visual por ancho.
- Respeto de filtros activos en Pedidos Hoy.
- Resumen compacto con cantidad de pedidos y total.

## Qué no se tocó

- /cliente
- /mesas
- Caja
- Gastos
- Cartera
- SQL
- Guardado de pedidos
- Impresión de comandas o tickets
