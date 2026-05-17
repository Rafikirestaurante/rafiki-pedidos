# Fase 12D — Auth administrativo con Supabase

## Objetivo
Implementar `supabase.auth.signInWithPassword()` para proteger el Panel Administrativo sin tocar los flujos de cliente, mesas, pedidos, WhatsApp, impresión ni cálculos.

## Cambios realizados

1. Login administrativo con Supabase Auth:
   - Email administrativo.
   - Contraseña.
   - Uso de `supabase.auth.signInWithPassword({ email, password })`.

2. Sesión persistente:
   - Se revisa la sesión activa con `supabase.auth.getSession()`.
   - Se escucha el cambio de sesión con `supabase.auth.onAuthStateChange()`.
   - Si hay sesión activa, el panel administrativo queda habilitado.

3. Cierre de sesión:
   - El botón de cerrar panel ahora ejecuta `supabase.auth.signOut()`.
   - También limpia el respaldo temporal anterior.

4. Respaldo temporal:
   - Si todavía no se ha creado usuario en Supabase Auth, se puede dejar el email vacío y usar la clave antigua `VITE_CLAVE_ADMIN`.
   - Esto evita quedar bloqueado durante la transición.

5. Sección Rafa:
   - Si el usuario inició sesión con Supabase Auth, puede entrar a Rafa desde el panel administrativo.
   - Si entra por respaldo temporal, Rafa conserva su protección anterior con `VITE_CLAVE_RAFA`.

## Archivos modificados

- `src/App.jsx`
- `src/components/screens/InicioAdmin.jsx`

## Verificación

- `npm run build` ejecutado correctamente.
- No se modificó la lógica de pedidos.
- No se modificó Supabase Realtime.
- No se modificó WhatsApp.
- No se modificó cliente ni mesas.
- No se incluyó `package-lock.json`.
