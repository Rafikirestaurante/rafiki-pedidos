# Fase 34D.3 — Hotfix recuadro visible en /cliente

Versión: `124.33-HOTFIX34D3-RECUADRO-CLIENTE-DESDE-APP-2026-06-26`

## Motivo

Aunque el componente `CodigoClienteEspecial` existía y estaba integrado en `PedidoCliente.jsx`, el recuadro no se estaba viendo en el link público de `/cliente`.

Para evitar depender de la posición interna del formulario de pedido, este hotfix renderiza el recuadro directamente desde `App.jsx` cuando la vista activa es `cliente`.

## Cambio aplicado

- Se importó `CodigoClienteEspecial` en `src/App.jsx`.
- Se agregó un bloque visible antes de `PedidoCliente`:

```jsx
<div className="layout cliente-codigo-publico-wrapper" id="codigo-cliente-publico">
  <section className="card cliente-codigo-publico-card">
    <CodigoClienteEspecial />
  </section>
</div>
```

- Se retiró el render interno del recuadro desde `PedidoCliente.jsx` para evitar duplicados.
- Se agregaron estilos específicos para que el bloque sea visible y no dependa de la grilla del formulario.

## Alcance

Este hotfix solo afecta el link público `/cliente`.

No modifica:

- `src/modules/mesas`
- `src/modules/caja`
- `src/modules/cartera`
- `src/services/pedidosService.js`
- reglas de acompañantes
- reglas de cafetería

## Resultado esperado

Al abrir `/cliente`, antes del menú debe aparecer:

```text
⭐ ¿Tienes código de cliente?
[Ej: RAFIKI-VIP] [Aplicar]
```

## Pendiente para 34E

- Quitar restricción de acompañantes solo si el cliente especial lo permite.
- Habilitar cafetería solo si el cliente especial lo permite.
- Guardar asociación del cliente especial en el pedido.
