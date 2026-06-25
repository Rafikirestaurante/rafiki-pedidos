# Fase 33F — Hotfix Ingresos días anteriores resta al arqueo final

## Objetivo

Ajustar definitivamente el comportamiento de **Ingresos días anteriores** en el Informe Caja para que no descuadre el cierre operativo del día.

## Regla aplicada

**Ingresos días anteriores** representa dinero que entró hoy, pero corresponde a ventas o pagos de días anteriores. Por eso:

- No suma a Ventas del día.
- No suma a Caja esperada.
- Se descuenta internamente del **Fin / arqueo contado** para calcular la diferencia final.

## Fórmula operativa

```text
Caja esperada =
Inicio del día
+ Ventas reales del día
- Gastos operativos
- Gastos Rafa
- Cuentas por cobrar
```

```text
Diferencia =
(Fin / arqueo contado - Ingresos días anteriores)
- Caja esperada
```

## Títulos del informe

No se cambiaron los títulos que ya se venían manejando en el informe:

- Ajustes de Caja
- Ingresos días anteriores
- Caja esperada
- Fin / arqueo contado
- Arqueos realizados

## Archivos modificados

- `src/modules/caja/components/CajaAdmin.jsx`
- `src/config/rafikiBuild.js`
- `public/rafiki-version.json`
