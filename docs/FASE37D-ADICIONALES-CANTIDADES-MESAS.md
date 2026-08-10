# Fase 37D — Adicionales con cantidades en `/mesas`

Base: versión 127.13 / Fase 37C.

## Cambio funcional

En la pestaña Restaurante de `/mesas`, la sección **Adicionales** permanece oculta hasta que exista al menos un almuerzo seleccionado. Se muestra de forma discreta al final del bloque de Restaurante y se despliega al tocar su título.

Cada producto adicional se maneja como un item independiente:

- Botón **Agregar** para iniciar en una unidad.
- Controles `−` y `+` para definir su propia cantidad.
- Al bajar de 1 a 0 se elimina del pedido.
- Precio, subtotal, resumen y comanda se calculan independientemente del número de almuerzos.
- Los adicionales no reciben un cobro adicional de empaque para llevar.
- Si se elimina el último almuerzo, los adicionales también se retiran automáticamente.

La lista continúa leyendo la categoría administrable **Adicionales almuerzo** del Catálogo de productos. No requiere migración de Supabase.
