# Fase 37E.2 — Flujo compacto con Datos y envío debajo del resumen

Base: versión 127.16 / Fase 37E.1.

## Cambios

- El Paso 3 de la vista Compacta de `/mesas` deja de abrirse en una ventana modal.
- El formulario real `DatosMesa` aparece debajo del Resumen del pedido.
- El modal queda reservado para los pasos 1 (Proteína) y 2 (Acompañantes).
- En el Paso 1, el botón principal **Continuar** usa el color verde oficial.
- En el Paso 2, las acciones quedan como **Agregar otro almuerzo** y **Continuar** en verde.
- **Agregar otro almuerzo** valida el almuerzo actual y abre inmediatamente el Paso 1 para el siguiente.
- **Continuar** cierra el modal y lleva al usuario al resumen; debajo quedan visibles los datos y el envío.
- Se eliminan los botones redundantes **Editar datos** y **Revisar y enviar** del resumen compacto.

No modifica Supabase, precios, impresión, validaciones financieras ni el flujo Normal de `/mesas`.
