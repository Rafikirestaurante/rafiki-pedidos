# Fase 34D.7 — Hotfix código cliente discreto y bienvenida destacada

Fecha: 2026-06-26  
Versión: `124.37-HOTFIX-CODIGO-CLIENTE-DISCRETO-BIENVENIDA-2026-06-26`

## Objetivo

Ajustar visualmente el bloque de código de cliente especial en `/cliente` antes de avanzar a 34E.

## Cambios

- El recuadro de código ahora es más discreto.
- Se elimina el texto largo posterior al aplicar el código:
  - nombre del cliente
  - código aplicado
  - texto “Se precargaron los datos disponibles...”
- Se conserva un mensaje de bienvenida más grande y limpio.
- Se mantiene el botón `Quitar código` como acción secundaria.

## Alcance

Aplica únicamente a `/cliente`.

No modifica:

- `/mesas`
- Caja
- Cartera
- Pedidos Hoy
- Lógica de registro de pedidos
- Reglas especiales de 34E

## Archivos modificados

- `src/modules/cliente/components/CodigoClienteEspecial.jsx`
- `src/styles/appStyles.js`
- `src/config/rafikiBuild.js`
- `public/rafiki-version.json`
- `README.md`
