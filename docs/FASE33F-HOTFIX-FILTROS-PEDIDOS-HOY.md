# Fase 33F — Hotfix filtros Pedidos Hoy

## Objetivo

Corregir los filtros rápidos de **Pedidos Hoy**, especialmente **Restaurante para llevar**, para que muestre todos los pedidos correspondientes sin importar si fueron creados desde `/cliente` o desde `/mesas`.

## Problema detectado

El filtro dependía demasiado de la marca individual `item.paraLlevar` y de una detección básica de cafetería/restaurante. Esto podía dejar por fuera pedidos válidos cuando:

- el pedido venía desde `/cliente` con `tipo_pedido: "cliente"`;
- el pedido venía desde `/mesas` con `tipo_pedido: "llevar"`;
- el pedido era antiguo o editado y algún ítem no tenía la marca `paraLlevar` perfecta;
- el producto de cafetería/restaurante no estaba clasificado exactamente con `categoria: "cafeteria"`.

## Corrección aplicada

Se reforzó la lógica en `AdminPedidosSection.jsx` para que los filtros rápidos consideren tanto el nivel del pedido como el nivel de los ítems:

- `/cliente` se interpreta como pedido externo para llevar, salvo que el pedido esté marcado como **Comer en restaurante**.
- `/mesas` con `tipo_pedido: "llevar"`, mesa `Llevar`, ubicación con `llevar`, `domicilio` o `recoger` también se interpreta como para llevar.
- Se reconoce `paraLlevar`, `para_llevar`, `para_llevar_item` y `llevar` en los ítems.
- La detección de cafetería ahora usa la utilidad central `esItemCafeteria`, más completa que la validación anterior.
- El filtro **Restaurante para llevar** y la impresión 80mm usan la misma lógica para evitar diferencias entre pantalla e impresión.

## Resultado esperado

Al filtrar **Restaurante para llevar**, deben aparecer completos los pedidos de restaurante para llevar creados desde:

- `/cliente`;
- `/mesas` en modo para llevar;
- pedidos antiguos donde el pedido indique llevar aunque algún ítem no tenga `paraLlevar` marcado.

Los pedidos marcados como **Comer en restaurante** no deben entrar en el filtro de para llevar.
