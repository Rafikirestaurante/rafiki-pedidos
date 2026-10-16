# Fase 35E — Selector térmico global 58 / 80 mm

## Objetivo

Limpiar la experiencia de impresión térmica en `/admin` y `/gerencia`, reemplazando los botones separados de **58 mm** y **80 mm** por un selector reutilizable.

La regla operativa se mantiene:

- **58 mm y 80 mm imprimen la misma información**.
- La diferencia está únicamente en el ancho, tamaño, espaciado y saltos de línea.

## Qué se agregó

### Componente global

Se creó:

```txt
src/modules/impresion/ThermalPrintControls.jsx
```

Este componente muestra:

```txt
Tamaño [80 mm / 58 mm]  🧾 Imprimir 80 mm
```

El formato elegido queda guardado en `localStorage`, de modo que si se selecciona 58 mm en un informe, los demás informes recuerdan esa preferencia.

### Preferencia centralizada

Se agregaron utilidades en:

```txt
src/modules/impresion/thermalReportService.js
```

Funciones nuevas:

```txt
obtenerFormatoTermicoPreferido
guardarFormatoTermicoPreferido
THERMAL_REPORT_FORMAT_STORAGE_KEY
```

## Dónde se integró

### Pedidos Hoy

En los filtros rápidos y en el modal de filtros se reemplazaron los botones dobles por el selector global.

### Informe Caja

En `Gerencia > Caja > Informe Caja`, el selector reemplaza los botones `Imprimir 58 mm` e `Imprimir 80 mm`.

### Gastos Diarios

En el informe de gastos se usa el mismo selector.

### Cartera

Se usa el selector en:

- Resumen de Cartera.
- Movimientos filtrados de Cartera.

## Qué no se modificó

No se tocó:

```txt
/cliente
/mesas
guardado de pedidos
Caja cálculos
Cartera cálculos
SQL
impresión de comandas o tickets
```

## Validaciones

Se agregó:

```bash
npm run thermal-selector:check
```

También se actualizaron los validadores térmicos existentes para reconocer el selector global.

Comandos recomendados:

```bash
npm run thermal-selector:check
npm run thermal-reports:check
npm run thermal-pedidos-hoy:check
npm run thermal-caja:check
npm run thermal-gastos-cartera:check
npm run build
npm run lint
```
