# Fase 36B.2 — Saneamiento y verificación automática

Versión: `127.2-FASE36B2-SANEAMIENTO-VERIFICACION-AUTOMATICA-2026-07-21`

## Objetivo

Fortalecer la base técnica de Rafiki Pedidos sin modificar los flujos operativos de pedidos, Caja, Cartera, Dashboard, impresión térmica o PWA.

## Cambios realizados

- ESLint ahora diferencia correctamente el código del navegador y los validadores Node `.mjs`.
- Se agregó `eslint-plugin-react` para reconocer los componentes usados dentro de JSX y evitar falsos positivos.
- Se retiraron imports, variables, funciones auxiliares y estados heredados que no eran utilizados.
- Se corrigieron escapes innecesarios y una conversión booleana redundante.
- Los validadores de Clientes Especiales, `/cliente` para llevar, Dashboard, Pedidos Hoy térmico y Caja dejaron de depender de formatos exactos o nombres antiguos de versión.
- Se centralizó la comparación numérica de versiones en `scripts/validation-utils.mjs`.
- Se agregó `package-lock.json` para instalaciones reproducibles.
- Se añadió `npm run metadata:check` para revisar versión, fase, fecha, dependencias, lock y scripts obligatorios.
- Se añadió `npm run check` como verificación integral automática.

## Verificación integral

`npm run check` ejecuta, en orden:

1. Metadatos, versión y `package-lock.json`.
2. ESLint estricto sin advertencias.
3. Pruebas automáticas.
4. Validadores de PWA, Dashboard, clientes especiales y cliente para llevar.
5. Todos los validadores de impresión térmica.
6. Compilación final de producción.

El proceso se detiene inmediatamente si alguno de los controles falla.

## Alcance operativo

Esta fase no incluye migraciones SQL ni cambios visuales o funcionales para el usuario. El Dashboard mensual de ventas, gastos y barras de la versión 127.1 se conserva íntegramente.
