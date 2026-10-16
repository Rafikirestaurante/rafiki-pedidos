# Fase 35F.2 — Hotfix térmico letra normal 1x1

## Objetivo

Corregir la impresión térmica administrativa porque en 58 mm, especialmente en **Pedidos Hoy**, la letra se veía demasiado pequeña y borrosa.

## Criterio aplicado

Se tomó como referencia el modo de ahorro de papel del **Rafiki Print Server**:

- Fuente térmica equivalente a normal 1x1.
- Sin negritas innecesarias.
- Sin subrayados.
- Sin separadores largos.
- Sin líneas en blanco adicionales.
- Sin márgenes grandes.
- Agrupar información por línea.

## Cambio técnico

El motor térmico administrativo dejó de renderizar las tablas como grid CSS pequeño y pasó a renderizar los listados como texto preformateado de ancho fijo.

Archivo principal:

```text
src/modules/impresion/thermalReportService.js
```

Cambios relevantes:

```text
fontSize: 12px
tableFontSize: 12px
lineHeight: 1
white-space: pre
thermal-pre-table
tableChars por formato
```

## Pedidos Hoy

La impresión conserva formato compacto:

```text
Ped   Cli     Ubic     Total
#2541 Mile    Llevar   $17.500
```

El reporte no imprime detalles largos del pedido.

## Alcance

Aplica al motor térmico usado por:

- Pedidos Hoy
- Caja
- Gastos
- Cartera

## No se tocó

- /cliente
- /mesas
- guardado de pedidos
- SQL
- cálculos de Caja
- cálculos de Cartera
- impresión de comandas o tickets del print server

## Validaciones

Se ejecutaron correctamente los validadores térmicos, PWA, clientes especiales y cliente para llevar.
