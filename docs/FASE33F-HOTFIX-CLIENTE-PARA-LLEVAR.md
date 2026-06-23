# Fase 33F Hotfix — Cliente para llevar obligatorio

## Objetivo

Corregir el flujo público `/cliente` para que todo pedido realizado desde el enlace de clientes quede marcado como **Para llevar** por defecto y de forma obligatoria, salvo cuando el cliente active explícitamente la opción:

> 🍽️ Comer en el restaurante  
> Registrar este pedido para comer en el restaurante

## Problema detectado

En algunos casos recientes, pedidos creados desde `/cliente` podían quedar sin `paraLlevar: true` en sus ítems. Esto afectaba:

- filtros de Pedidos Hoy,
- impresión y lectura operativa,
- cálculo del empaque/adicional para llevar,
- control de inventario relacionado con empaques,
- identificación de pedidos externos frente a pedidos en mesa.

## Cambios aplicados

### 1. Regla obligatoria en App.jsx

Se agregó una normalización de destino para `/cliente`:

- si `comerRestauranteCliente === false`, todos los ítems quedan con `paraLlevar: true`;
- si `comerRestauranteCliente === true`, todos los ítems quedan con `paraLlevar: false`.

Esto se aplica al iniciar la vista cliente, al cambiar la opción de restaurante, al cambiar producto, al agregar productos y al reiniciar el pedido.

### 2. Interfaz del cliente

El check visual **🥡 Para llevar** queda bloqueado en `/cliente`, para evitar que el usuario desmarque accidentalmente el empaque. La única forma de cambiar el destino del pedido es activar **🍽️ Comer en el restaurante**.

### 3. Blindaje al guardar

En `usePedidos.js`, antes de guardar el pedido del cliente, los ítems se normalizan nuevamente. Esto evita que un estado viejo, caché o inconsistencia visual guarde un pedido externo sin `paraLlevar: true`.

### 4. Filtros de Pedidos Hoy

Se reforzó la detección de pedidos para llevar en `AdminPedidosSection.jsx`, considerando también `tipo_pedido: "cliente"` como pedido externo/para llevar cuando aplique.

## Resultado esperado

- Todo pedido nuevo desde `/cliente` queda para llevar automáticamente.
- El adicional para llevar vuelve a calcularse cuando corresponde.
- Los filtros de Pedidos Hoy identifican correctamente pedidos de cliente como para llevar.
- Si el cliente marca **Comer en el restaurante**, el pedido se guarda como mesa/restaurante, sin adicional para llevar.

## Archivos modificados

```text
src/App.jsx
src/shared/hooks/usePedidos.js
src/modules/cliente/components/PedidoCliente.jsx
src/modules/admin/components/pedidos/AdminPedidosSection.jsx
src/config/rafikiBuild.js
public/rafiki-version.json
docs/FASE33F-HOTFIX-CLIENTE-PARA-LLEVAR.md
```
