# Fase 34D.8 — Hotfix bienvenida de cliente especial en modal

Fecha: 2026-06-26  
Versión: `124.38-HOTFIX-CODIGO-CLIENTE-BIENVENIDA-MODAL-2026-06-26`

## Objetivo

Mejorar la experiencia visual del mensaje de bienvenida cuando un cliente ingresa un código especial válido en `/cliente`.

## Cambios realizados

- Se reemplazó el mensaje fijo de bienvenida por un `RafikiModal` elegante.
- El modal muestra:
  - título `¡Bienvenido!`
  - icono destacado
  - mensaje personalizado configurado para el cliente especial o `Bienvenido, [nombre]`
  - botón `Continuar pedido`
- Se mantiene discreto el recuadro inicial de código.
- Se mantiene el botón secundario `Quitar código` después de aplicar un código.
- Se corrigió la ubicación de los estilos del hotfix visual anterior para que queden dentro de `appStyles` y no fuera del template literal.

## Alcance

Este hotfix solo afecta el componente visual de código especial en `/cliente`.

No se activaron todavía las reglas de 34E:

- sin restricción de acompañantes
- cafetería habilitada para clientes especiales
- promociones
- descuentos
- regalos

## Archivos modificados

- `src/modules/cliente/components/CodigoClienteEspecial.jsx`
- `src/styles/appStyles.js`
- `src/config/rafikiBuild.js`
- `public/rafiki-version.json`
- `README.md`

## Validaciones

- `node scripts/validate-pwa.mjs`: OK.
- `node --check src/styles/appStyles.js`: OK.

No se tocaron `/mesas`, Caja, Cartera, Pedidos Hoy ni servicios de pedidos.
