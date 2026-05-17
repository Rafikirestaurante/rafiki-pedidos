# Fase 12G Fix - Cargando datos de Rafiki

## Problema detectado
La pantalla se quedaba en `Cargando datos de Rafiki...` porque la variable global `cargando` dependía de:

- `cargandoMenu`
- `cargandoPedidos`
- `adminAuthCargando`

Si una consulta a Supabase tardaba demasiado o no respondía, alguno de esos estados podía quedarse activo y bloqueaba toda la aplicación.

## Corrección aplicada
Se agregó protección de tiempo máximo a:

1. Revisión de sesión administrativa con Supabase Auth.
2. Carga del menú diario.
3. Carga de pedidos.
4. Consulta del rol en la tabla `usuarios_roles`.

## Resultado esperado
La aplicación ya no debe quedarse indefinidamente en la pantalla de carga.
Si Supabase tarda demasiado, la app libera la pantalla y muestra un mensaje de error controlado.

## Seguridad
No se cambiaron los flujos de cliente, mesas, WhatsApp, creación de pedidos ni cálculos.
