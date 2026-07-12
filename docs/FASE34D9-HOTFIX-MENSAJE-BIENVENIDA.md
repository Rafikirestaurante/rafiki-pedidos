# Fase 34D.9 — Hotfix mensaje de bienvenida cliente especial

Fecha: 2026-06-26
Versión: 124.39-HOTFIX-MENSAJE-BIENVENIDA-CLIENTE-2026-06-26

## Objetivo

Ajustar únicamente el texto del modal que aparece en `/cliente` después de aplicar un código de cliente especial válido.

## Nuevo mensaje

```text
¡Bienvenido!
⭐
Bienvenido, [nombre del cliente]
Gracias por preferirnos. Ya puedes continuar con tu pedido.
[Continuar pedido]
```

## Alcance

- Se mantiene el modal elegante creado en 34D.8.
- Se cambia el texto secundario del modal.
- No se modifican reglas de acompañantes, cafetería, descuentos ni promociones.
- No se modifica `/mesas`.

## Archivos modificados

- `src/modules/cliente/components/CodigoClienteEspecial.jsx`
- `src/config/rafikiBuild.js`
- `public/rafiki-version.json`
- `README.md`
