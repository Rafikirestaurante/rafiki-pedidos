# Fase 42 — Usuarios y permisos

Se incorpora en Gerencia → Ajustes → Usuarios y permisos la consulta de las cuentas actuales de `usuarios_roles`, con edición de rol y activación/desactivación. Las cuentas existentes se conservan. Ejecutar la migración SQL una sola vez.

## Fase 42B
Se agregan creación segura de cuentas y restablecimiento de contraseñas mediante la Edge Function `admin-users`. La `service_role` nunca se expone al navegador. Desplegar la función antes de usar estos botones.
