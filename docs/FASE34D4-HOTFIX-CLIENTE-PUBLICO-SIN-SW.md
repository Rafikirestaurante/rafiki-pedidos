# Fase 34D.4 — Hotfix recuadro código visible en link público

## Problema

El recuadro **“¿Tienes código de cliente?”** fue agregado en 34D, 34D.1, 34D.2 y 34D.3, pero en pruebas reales seguía sin aparecer en el link público de `/cliente`.

## Análisis de raíz

Se comprobó que el código sí estaba en el bundle y que `npm run build` compilaba correctamente. El problema no era de importación ni de sintaxis.

La raíz más probable era doble:

1. El recuadro quedó fuera del componente principal que el cliente reconoce visualmente como el formulario del pedido.
2. Aunque `/cliente` no es una PWA instalada, el proyecto registraba `serviceWorker` desde `main.jsx` para todo el dominio. Eso podía hacer que el link público siguiera usando un bundle anterior servido desde caché.

## Corrección aplicada

### 1. Recuadro dentro del componente real del pedido

El recuadro se movió al interior de:

```txt
src/modules/cliente/components/PedidoCliente.jsx
```

Ahora se renderiza dentro de la primera tarjeta del pedido, justo debajo del encabezado del menú y antes de “Arma tu pedido paso a paso”.

### 2. `/cliente` como link público sin service worker

Se agregó:

```txt
src/shared/utils/clientePublicoRuntime.js
```

Y se ajustó:

```txt
src/main.jsx
```

Para que en las rutas públicas:

```txt
/
/cliente
/pedido
```

no se registre el service worker. Además, si existía un service worker previo controlando el navegador, se limpia una vez y se recarga la ruta con `cliente_refresh`.

## Alcance conservador

No se modificó:

```txt
src/modules/mesas
src/modules/caja
src/modules/cartera
src/services/pedidosService.js
src/shared/hooks/usePedidos.js
```

## Qué NO hace todavía

Este hotfix solo garantiza visibilidad y validación inicial del código.

No activa todavía:

```txt
sin restricción de acompañantes
cafetería para clientes especiales
promociones
descuentos
regalos
```

Eso queda para 34E.

## Validaciones

Se ejecutó:

```bash
npm run build
npm run lint
node scripts/validate-pwa.mjs
```

