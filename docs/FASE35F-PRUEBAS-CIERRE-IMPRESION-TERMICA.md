# Fase 35F — Pruebas y cierre de impresión térmica administrativa

Versión: `125.7-FASE35F-PRUEBAS-CIERRE-IMPRESION-TERMICA-2026-07-01`

## Objetivo

Cerrar la Fase 35 con una base estable para imprimir informes administrativos en impresoras térmicas de 58 mm y 80 mm.

La regla principal se mantiene:

- 58 mm y 80 mm imprimen la misma información.
- La diferencia está únicamente en ancho, compactación, tamaño de tabla y saltos de línea.
- Los listados deben priorizar formato de tabla compacta para ahorrar papel.

## Ajuste fino aplicado

Se ajustó el motor central `thermalReportService.js` para que las tablas térmicas usen una configuración más compacta:

- Fuente monoespaciada en tablas.
- Tamaño de celda diferenciado para 58 mm y 80 mm.
- Encabezados más pequeños.
- Menor espacio entre columnas en 58 mm.
- Menor padding por fila.

Esto mejora especialmente reportes como:

- Pedidos Hoy: `Pedido | Cliente | Ubicación | Total`
- Gastos: `Proveedor | Categoría | Pago | Valor`
- Cartera: `Cliente | Teléfono | Saldo` o `Pedido | Cliente | Estado | Saldo`

## Matriz de pruebas manuales recomendada

### Pedidos Hoy

1. Imprimir Todos en 58 mm.
2. Imprimir Todos en 80 mm.
3. Filtrar Para llevar e imprimir.
4. Filtrar Restaurante en mesa e imprimir.
5. Confirmar que no aparece detalle largo del pedido.
6. Confirmar que solo aparece pedido, cliente, ubicación y total.

### Caja

1. Imprimir Informe Caja en 58 mm.
2. Imprimir Informe Caja en 80 mm.
3. Validar que la fórmula de caja se mantenga clara.
4. Confirmar que ingresos días anteriores no aparecen sumados a ventas.

### Gastos

1. Imprimir gastos de un día con pocos registros.
2. Imprimir gastos de un día con muchos registros.
3. Confirmar tabla compacta y totales.

### Cartera

1. Imprimir resumen de cartera.
2. Imprimir movimientos filtrados.
3. Validar que la tabla no imprima observaciones largas.

## Alcance

No se modificaron cálculos, guardado de pedidos, SQL, comandas, `/cliente`, `/mesas`, Caja en lógica interna ni Cartera en lógica interna.

Esta fase cierra la base de impresión administrativa y deja lista una eventual Fase 36 de ajustes operativos o reportes adicionales.
