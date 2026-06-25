# Fase 33F — Hotfix Ingresos días anteriores en Informe Caja

## Objetivo

Agregar y corregir el campo **Ingresos días anteriores** en **Caja > Informe Caja > Ajustes de Caja** para registrar dinero que entra hoy, pero corresponde a ventas, cobros o pagos de días previos.

## Regla contable operativa definitiva

El campo **no suma a ventas del día**, porque no corresponde a una venta generada hoy.

Sí suma a **Caja esperada**, porque ese dinero entró hoy en efectivo, Bancolombia, Nequi u otra cuenta y por lo tanto debe estar dentro del arqueo contado o saldo final.

Esto evita inflar indicadores comerciales, pero permite que el cuadre de caja no muestre como sobrante un pago recibido de días anteriores.

## Fórmula actualizada

```text
Caja esperada =
Inicio del día
+ Ventas reales del día
+ Ingresos días anteriores
- Gastos operativos
- Gastos Rafa
- Cuentas por cobrar

Diferencia =
Arqueo contado
- Caja esperada
```

## Cambios aplicados

- Se mantiene `ingresosDiasAnteriores` dentro de la estructura de ajustes de caja.
- El Informe Caja muestra el valor dentro del bloque **Ajustes de Caja**.
- El modal **Editar ajustes** mantiene el campo **Ingresos días anteriores**.
- El informe de WhatsApp incluye **Ingresos días anteriores**.
- El CSV/Excel incluye **Ingresos días anteriores**.
- La fórmula visual del informe aclara que este ingreso suma a caja esperada, pero no modifica ventas del día.

## Persistencia

No se requiere SQL nuevo porque el valor se guarda dentro de `ajustes_data`, campo JSON ya existente en `caja_arqueos`.

## Archivos modificados

```text
src/modules/caja/components/CajaAdmin.jsx
src/config/rafikiBuild.js
public/rafiki-version.json
docs/FASE33F-HOTFIX-INGRESOS-DIAS-ANTERIORES.md
docs/FASE33F-HOTFIX-INGRESOS-DIAS-ANTERIORES-SUMA-CAJA-ESPERADA.md
```

## Versión

```text
123.13-HOTFIX-INGRESOS-DIAS-ANTERIORES-SUMA-CAJA-ESPERADA-2026-06-24
```
