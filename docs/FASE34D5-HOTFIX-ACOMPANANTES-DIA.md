# Hotfix 34D.5 — Mensaje de acompañantes del día

## Objetivo

Ajustar el mensaje mostrado cuando un producto de Restaurante no permite selección manual de acompañantes.

Aplica para:

- Sopas.
- Pastas.
- Arroces tipo “Arroz de ...” o “Arroz trifásico”.

Estos productos siguen sin mostrar el selector de acompañantes, pero ya no deben verse como “Producto de sopas” ni como “no requiere acompañantes”.

## Cambio funcional

Antes se mostraba:

```text
🥣 Producto de sopas
Este producto no requiere acompañantes.
```

Ahora se muestra:

```text
Este Producto viene con acompañantes del día
```

## Archivos modificados

```text
src/shared/utils/pedidos.js
src/modules/cliente/components/PedidoCliente.jsx
src/modules/mesas/components/PanelMesas.jsx
src/config/rafikiBuild.js
public/rafiki-version.json
README.md
```

## Alcance

- Se mantiene la lógica existente de `esProductoSinAcompanantes`.
- No se toca Caja, Cartera, Pedidos Hoy ni servicios de guardado.
- No se activa todavía ninguna regla de cliente especial de 34E.
- El cambio aplica visualmente tanto en `/cliente` como en `/mesas`.

## Validaciones

Comandos ejecutados:

```bash
npm run build
npm run lint
node scripts/validate-pwa.mjs
```

Resultado:

- Build correcto.
- Lint sin errores, solo advertencias antiguas ya existentes.
- Validación PWA correcta.
