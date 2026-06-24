# Fase 33F — Hotfix Ingresos días anteriores resta al arqueo contado

## Objetivo

Corregir el comportamiento de **Ingresos días anteriores** en **Caja > Informe Caja > Ajustes de Caja**.

El campo sirve para registrar dinero recibido hoy que corresponde a ventas o pagos de días previos. Ese dinero puede aparecer en efectivo, Bancolombia, Nequi u otra cuenta, pero no pertenece a la venta operativa del día.

## Regla aplicada

- No suma a ventas del día.
- No suma a caja esperada.
- Se descuenta del arqueo contado al calcular la diferencia.
- Se mantiene visible dentro de **Ajustes de Caja** sin cambiar los títulos del informe.

## Fórmula

```text
Caja esperada =
Inicio del día
+ Ventas reales del día
- Gastos operativos
- Gastos Rafa
- Cuentas por cobrar

Diferencia =
(Arqueo contado - Ingresos días anteriores)
- Caja esperada
```

## Archivos modificados

```text
src/modules/caja/components/CajaAdmin.jsx
src/config/rafikiBuild.js
public/rafiki-version.json
docs/FASE33F-HOTFIX-INGRESOS-DIAS-ANTERIORES.md
docs/FASE33F-HOTFIX-INGRESOS-DIAS-ANTERIORES-RESTA-ARQUEO.md
```

## Versión

```text
123.10-HOTFIX-INGRESOS-DIAS-ANTERIORES-RESTA-ARQUEO-2026-06-24
```
