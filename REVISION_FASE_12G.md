# Fase 12G — Roles desde tabla usuarios_roles

Cambios realizados:

- El rol administrativo ahora se consulta desde la tabla `usuarios_roles` en Supabase.
- La búsqueda se hace por el email del usuario autenticado.
- Si el correo tiene rol `admin`, puede ver la sección Rafa y borrar pedidos.
- Si el correo tiene rol `usuario`, no puede ver Rafa ni borrar pedidos.
- Si el correo no aparece en la tabla, el sistema usa el rol seguro `usuario`.
- Se mantiene compatibilidad con metadata como respaldo, pero la prioridad ahora es la tabla.

Verificación:

- `npm run build` ejecutado correctamente.
- No se cambió la lógica de cliente, mesas, WhatsApp, creación de pedidos ni cálculos.
- No se incluye `package-lock.json`.
