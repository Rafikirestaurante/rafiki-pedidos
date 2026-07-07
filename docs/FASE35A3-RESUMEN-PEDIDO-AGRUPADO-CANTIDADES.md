# Fase 35A.3 — Resumen del pedido agrupado y cantidades editables

Base: `126.2-FASE35A2-INSUMOS-PENDIENTES-MOBILE-AMPM-2026-07-06.zip`.

## Objetivo

Optimizar el resumen del pedido en `/cliente` y `/mesas` para que los productos repetidos se vean como una sola línea con cantidad acumulada y para que la cantidad pueda editarse directamente desde el resumen final.

## Cambios aplicados

### 1. Agrupación automática de productos iguales

Se creó la utilidad compartida `src/shared/utils/resumenPedido.js`, encargada de identificar productos iguales de forma segura.

La agrupación solo ocurre cuando coinciden los datos relevantes del producto:

- Nombre del producto.
- Categoría, tipo y área.
- Precio base.
- Condición para llevar.
- Acompañantes.
- Observaciones de acompañantes.
- Adicionales de almuerzo.
- Datos especiales de cafetería como tamaño, frutas, base, acompañante, bebida y adicionales.

Esto evita unir por error dos almuerzos con el mismo nombre pero con acompañantes o adicionales distintos.

### 2. Cantidad editable desde el resumen

En `/cliente` y `/mesas`, cada línea del resumen ahora muestra un selector de cantidad con botones `−` y `+`.

Al modificar la cantidad de una línea agrupada:

- Se conserva el primer producto como línea principal.
- Se actualiza su cantidad total.
- Se eliminan las líneas duplicadas del estado interno.
- El total del pedido se recalcula normalmente con la lógica existente.

### 3. Borrado por grupo

El botón `Borrar` en el resumen ahora elimina el grupo completo cuando una línea representa varios productos iguales.

### 4. Consolidación interna antes de guardar

Además de mostrar la agrupación visualmente, se agregó consolidación del estado interno en `/cliente` y `/mesas`, de forma que al guardar el pedido no queden varias líneas repetidas cuando realmente corresponden al mismo producto.

## Áreas no modificadas

No se tocaron:

- SQL.
- Supabase.
- Caja.
- Cartera.
- Pedidos Hoy.
- Informes térmicos.
- Clientes especiales.
- Service worker o lógica PWA de `/cliente`.

## Validación

- `npm run build` ejecutado correctamente.
- ESLint ejecutado sobre los archivos modificados sin errores nuevos; solo se mantienen advertencias preexistentes de variables/imports no usados reportadas por la configuración actual.
