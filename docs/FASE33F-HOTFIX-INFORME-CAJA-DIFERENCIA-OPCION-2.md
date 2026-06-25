# Fase 33F — Hotfix Informe Caja diferencia opción 2

## Objetivo

Corregir el cálculo de diferencia en **Caja > Informe Caja** de acuerdo con la operación validada en el archivo `informe-caja-2026-06-24.xlsx`.

La opción correcta es la **Opción 2**: los **Ingresos días anteriores** no deben sumarse a ventas ni a Caja esperada, pero sí deben reducir la diferencia operativa del cierre.

## Fórmula corregida

La Caja esperada se mantiene así:

```text
Caja esperada =
Inicio del día
+ Ventas reales del día
- Gastos operativos
- Gastos Rafa
- Cuentas por cobrar
```

La diferencia se calcula así, respetando la convención interna de la app:

```text
Diferencia =
Fin / arqueo contado
+ Ingresos días anteriores
- Caja esperada
```

Con esta lógica, si el resultado es negativo, la app muestra **Falta dinero**; si es positivo, muestra **Sobra dinero**.

## Ejemplo validado

```text
Caja esperada:              1.705.233
Fin / arqueo contado:       1.477.100
Ingresos días anteriores:     197.000

Diferencia interna:
1.477.100 + 197.000 - 1.705.233 = -31.133

Resultado mostrado:
Falta dinero: 31.133
```

Esto coincide con la Opción 2 del archivo de análisis.

## Alcance

- No cambia títulos del informe.
- No suma ingresos días anteriores a ventas.
- No suma ingresos días anteriores a Caja esperada.
- Ajusta únicamente la fórmula de diferencia.
- Actualiza texto explicativo, exportación y WhatsApp usan el mismo valor final.

## Archivos modificados

```text
src/modules/caja/components/CajaAdmin.jsx
src/config/rafikiBuild.js
public/rafiki-version.json
docs/FASE33F-HOTFIX-INFORME-CAJA-DIFERENCIA-OPCION-2.md
```

## SQL

No requiere SQL nuevo.
