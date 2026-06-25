# Fase 33F — Corrección definitiva Ingresos días anteriores suma a Caja esperada

## Objetivo

Corregir la fórmula de **Informe Caja** para que **Ingresos días anteriores** sume a **Caja esperada**, sin sumar a **Ventas del día**.

## Decisión operativa

Si hoy recibes dinero de días anteriores, ese valor sí debe esperarse en el arqueo o en las cuentas del día. Por eso suma a **Caja esperada**.

Sin embargo, no representa una venta nueva del día, por lo tanto no debe alterar ventas, cantidad de pedidos, productos vendidos ni indicadores comerciales.

## Fórmula definitiva

```text
Caja esperada =
Inicio del día
+ Ventas reales
+ Ingresos días anteriores
- Gastos operativos
- Gastos Rafa
- Cuentas por cobrar

Diferencia =
Fin / arqueo contado
- Caja esperada
```

## Títulos del informe

No se cambiaron los títulos que ya venía usando el informe. Se mantiene la estructura visual existente:

```text
Ajustes de Caja
Ingresos días anteriores
Caja esperada
Fin / arqueo contado
Arqueos realizados
```

## Alcance

- No hay SQL nuevo.
- No se tocan ventas del día.
- No se modifican nombres de secciones.
- Solo se corrige la fórmula y la documentación.
