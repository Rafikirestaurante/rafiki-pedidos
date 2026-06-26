# Fase 34D.6 — Hotfix Pastas dentro de Platos

## Objetivo

Corregir el caso pendiente donde algunos productos creados como categoría **Platos** contienen la palabra **Pastas** en el nombre, pero todavía mostraban selector o mensaje incorrecto de acompañantes.

## Ajuste aplicado

Se fortaleció `esProductoSinAcompanantes` en `src/shared/utils/pedidos.js` para que la detección no dependa únicamente de la categoría.

Ahora se evalúa también el nombre visible del producto:

- categoría contiene `sopa` o nombre contiene `sopa`
- categoría contiene `pasta` o nombre contiene `pasta`
- nombre empieza o contiene `arroz de`
- nombre contiene `arroz trifasico` / `arroz trifásico`

## Resultado esperado

En `/cliente` y `/mesas`, un producto como:

- `Pastas boloñesa`
- `Pastas con pollo`
- `Platos / Pastas napolitana`

ya no debe pedir acompañantes manuales y debe mostrar:

> Este Producto viene con acompañantes del día

## Alcance

No se tocaron Caja, Cartera, Pedidos Hoy ni Clientes Especiales 34E.
