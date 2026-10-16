# 125.8-HOTFIX35F1-AHORRO-PAPEL-TERMICO-ESC-POS-2026-07-01

## Objetivo

Corregir el estilo de impresión térmica administrativa para acercarlo al concepto usado en Rafiki Print Server: letra normal, sin negritas innecesarias, sin separadores largos, sin márgenes grandes y con interlineado compacto.

## Motivo

La fase 35F había optimizado el contenido en tablas compactas, pero la letra y el estilo seguían comportándose como impresión web. En impresoras térmicas pequeñas esto hacía que el texto se viera mal o demasiado apretado.

## Ajuste aplicado

Se modificó el motor central:

```text
src/modules/impresion/thermalReportService.js
```

Cambios principales:

```text
Fuente monoespaciada tipo térmica
Letra normal legible en 58 mm y 80 mm
Sin negritas forzadas
Sin subrayados
Sin separadores largos
Sin márgenes adicionales
Sin líneas en blanco innecesarias
Interlineado compacto
Tablas compactas conservadas
```

## Regla conservada

```text
58 mm y 80 mm imprimen la misma información.
La diferencia sigue siendo solo visual: ancho, compactación y saltos de línea.
```

## Módulos beneficiados

```text
Pedidos Hoy
Caja
Gastos
Cartera
Selector térmico global
```

## No se tocó

```text
/cliente
/mesas
guardado de pedidos
SQL
cálculos de Caja
cálculos de Cartera
impresión de comandas o tickets normales
```

## Validación agregada

```bash
npm run thermal-ahorro:check
```

También se mantiene:

```bash
npm run thermal-cierre:check
npm run thermal-tabla:check
```
