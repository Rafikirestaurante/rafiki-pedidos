# Fase 33F — Hotfix Ingresos días anteriores en Informe Caja

## Objetivo

Agregar en **Caja > Informe Caja > Ajustes de Caja** un nuevo campo llamado **Ingresos días anteriores** para registrar dinero que entra hoy, pero corresponde a ventas o pagos de días previos.

## Regla contable operativa

El nuevo campo **no suma a ventas** y **no suma a caja esperada**. Como ese dinero ya aparece dentro del efectivo o la cuenta bancaria contada, se descuenta del **arqueo contado** al calcular la diferencia del informe.

Esto evita inflar indicadores comerciales y evita que un pago de días anteriores aparezca como sobrante de la operación actual.

## Fórmula actualizada

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

## Cambios aplicados

- Se agregó `ingresosDiasAnteriores` a la estructura de ajustes de caja.
- Se normaliza el campo al cargar ajustes guardados desde Supabase.
- El Informe Caja muestra el valor dentro del bloque **Ajustes de Caja**.
- El modal **Editar ajustes** incluye el nuevo campo.
- El informe de WhatsApp incluye **Ingresos días anteriores**.
- El CSV/Excel incluye **Ingresos días anteriores**.
- La fórmula visual del informe aclara que este ingreso no modifica ventas del día ni caja esperada.

## Persistencia

No se requiere SQL nuevo porque el valor se guarda dentro de `ajustes_data`, campo JSON ya existente en `caja_arqueos`.

## Archivos modificados

```text
src/modules/caja/components/CajaAdmin.jsx
src/config/rafikiBuild.js
public/rafiki-version.json
docs/FASE33F-HOTFIX-INGRESOS-DIAS-ANTERIORES.md
```

## Versión

```text
123.10-HOTFIX-INGRESOS-DIAS-ANTERIORES-RESTA-ARQUEO-2026-06-24
```
