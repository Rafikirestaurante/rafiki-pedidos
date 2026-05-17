# Fase 12F - Roles admin / usuario

Cambios realizados:

- Se simplificaron los roles administrativos a solo dos opciones:
  - `admin`
  - `usuario`

- Permisos del rol `admin`:
  - Ver pedidos
  - Editar menú diario
  - Solicitud de insumos
  - Generador de menú
  - Ver sección Rafa
  - Borrar pedidos
  - Cambiar estado de pedidos
  - Finalizar pedidos pendientes

- Permisos del rol `usuario`:
  - Ver pedidos
  - Editar menú diario
  - Solicitud de insumos
  - Generador de menú
  - Cambiar estado de pedidos
  - Finalizar pedidos pendientes

- Restricciones del rol `usuario`:
  - No ve la pestaña Rafa
  - No ve ni puede usar el botón de borrar pedidos

- Seguridad adicional:
  - Si un usuario no tiene rol definido en Supabase, queda como `usuario` por defecto.
  - Esto evita que una cuenta nueva tenga permisos de administrador por accidente.

No se modificó:

- Cliente
- Panel mesas
- WhatsApp
- Creación de pedidos
- Cálculos
- Supabase Realtime
