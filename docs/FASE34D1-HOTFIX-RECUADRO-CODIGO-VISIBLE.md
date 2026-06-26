# Fase 34D.1 — Hotfix recuadro código cliente visible

## Objetivo

Asegurar que el recuadro **“⭐ ¿Tienes código de cliente?”** quede visible al inicio de `/cliente`.

## Ajustes realizados

- Se movió `CodigoClienteEspecial` al inicio de la tarjeta principal de `/cliente`, antes del hero del menú.
- Se mantuvo la integración con la RPC `validar_cliente_especial_codigo`.
- Se conserva la precarga de nombre, teléfono y ubicación cuando el código es válido.
- Nota corregida en 34D.2: `/cliente` corresponde al link público de clientes y no debe mezclarse con rutas PWA internas.

## Alcance protegido

No se modificaron:

- `src/modules/mesas`
- `src/shared/hooks/usePedidos.js`
- `src/services/pedidosService.js`
- `src/modules/caja`
- `src/modules/cartera`

## Pendiente para 34E

- Quitar mínimo de acompañantes para clientes especiales.
- Habilitar cafetería en `/cliente` para clientes especiales.
- Guardar código especial asociado al pedido.
