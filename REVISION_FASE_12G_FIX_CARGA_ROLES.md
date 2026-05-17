# Fase 12G - Fix profundo carga y roles

## Problema detectado
La pantalla global `Cargando datos de Rafiki...` estaba dependiendo de tres cargas al mismo tiempo:

- `cargandoMenu`
- `cargandoPedidos`
- `adminAuthCargando`

Eso hacía que rutas públicas como `/mesas` quedaran esperando consultas administrativas o de pedidos, aunque no fueran necesarias para abrir el panel.

## Corrección aplicada
1. El cargador global ahora solo bloquea vistas administrativas mientras se verifica la sesión:
   - `/admin`
   - login administrativo

2. `/cliente` y `/mesas` ya no quedan bloqueados por:
   - lectura de roles
   - lectura de pedidos administrativos
   - auth administrativa

3. La consulta de rol desde `usuarios_roles` quedó más rápida y explícita:
   - busca por email
   - límite de 1 registro
   - tiempo máximo reducido a 2.5 segundos
   - fallback seguro a `usuario`
   - `console.warn` si Supabase/RLS responde error

## Verificación
- `npm run build` exitoso.
- No se cambió lógica de pedidos, WhatsApp, menú ni Supabase insert/update.
- No se incluyó `package-lock.json`.
