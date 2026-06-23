# Fase 33F — Hotfix 123.7: Paginación Pedidos Hoy + Dashboard gastos completos

## Objetivo

Corregir dos puntos operativos detectados después de la Fase 33F:

1. La tabla de **Pedidos Hoy** volvía a la página 1 ante cualquier actualización de pedidos.
2. El **Dashboard Rafa** agrupaba categorías de gastos menores dentro de “Otros”, ocultando el detalle completo.

## 1. Estabilidad de paginación en Pedidos Hoy

Archivo modificado:

```text
src/modules/pedidos/components/PedidosAdmin.jsx
```

Se eliminó el reinicio agresivo:

```js
useEffect(() => {
  setPaginaActual(1);
}, [pedidos]);
```

### Motivo

El arreglo `pedidos` cambia de referencia con frecuencia por acciones del usuario, realtime, edición de pedidos, cambios de estado y refrescos internos. Cada cambio devolvía la tabla a la página 1, incluso si el usuario estaba trabajando en la página 2 o siguientes.

### Protección conservada

Se mantuvo el control que ajusta la página únicamente cuando la página actual ya no existe:

```js
useEffect(() => {
  if (paginaActual > totalPaginas) {
    setPaginaActual(totalPaginas);
  }
}, [paginaActual, totalPaginas]);
```

Con esto la tabla conserva la página durante actualizaciones normales, pero evita quedar en una página inválida cuando los filtros reducen los resultados.

## 2. Dashboard Rafa con gastos completos

Archivo modificado:

```text
src/modules/dashboard/components/DashboardRafa.jsx
```

El bloque **Gastos por categoría** ya no usa `agruparConOtros`.

Ahora muestra todas las categorías con valor mayor a 0, ordenadas de mayor a menor, sin consolidar categorías pequeñas en “Otros”.

También se agregó un texto aclaratorio y un total de categorías visibles para facilitar auditoría del periodo.

## Archivos actualizados

```text
src/modules/pedidos/components/PedidosAdmin.jsx
src/modules/dashboard/components/DashboardRafa.jsx
src/config/rafikiBuild.js
public/rafiki-version.json
docs/FASE33F-HOTFIX-PAGINACION-DASHBOARD-GASTOS.md
```

## SQL

No requiere cambios en Supabase.
