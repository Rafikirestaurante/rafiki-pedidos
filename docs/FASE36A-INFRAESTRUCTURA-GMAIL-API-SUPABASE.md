# Fase 36A — Infraestructura Gmail API desde Supabase

Versión: `127.0-FASE36A-INFRAESTRUCTURA-GMAIL-API-SUPABASE-2026-07-11`

## Objetivo

Crear la conexión segura entre Rafiki y una cuenta de Gmail sin utilizar Google Sheets ni Apps Script. Esta subfase solo configura y valida el acceso de lectura. El motor que extraerá Bancolombia, Nequi y facturas electrónicas se implementará en la siguiente entrega.

## Arquitectura

```text
Rafiki (Administrador)
       ↓ OAuth 2.0
Supabase Edge Functions
       ↓ Gmail API solo lectura
Gmail
       ↓ credencial cifrada
Supabase Database
```

## Alcance implementado

- Nueva pestaña `Gerencia > Consignaciones y facturas`.
- Botón `Conectar Gmail`.
- Flujo OAuth 2.0 de servidor.
- Solicitud exclusiva del alcance `gmail.readonly`.
- `state` aleatorio, de un solo uso y vencimiento de 10 minutos.
- Intercambio seguro del código de Google en una Edge Function.
- Refresh token cifrado con AES-256-GCM antes de guardarlo.
- Consulta del perfil de Gmail para comprobar la cuenta autorizada.
- Botón `Probar conexión`.
- Botón `Desconectar Gmail` con revocación del token en Google.
- Auditoría de conexión, pruebas, errores y desconexión.
- Acceso restringido al rol `admin` de `usuarios_roles`.

## Fuera del alcance

- No se consultan todavía correos bancarios.
- No se descargan ZIP ni XML.
- No se crean movimientos documentales.
- No se usa Google Sheets.
- No se usa Apps Script.
- No se modifica Caja, Cartera, Gastos, Pedidos, arqueos ni saldos.

## Archivos principales

```text
supabase/2026-07-11-fase36a-gmail-api-infraestructura.sql
supabase/config.toml
supabase/functions/_shared/*
supabase/functions/gmail-oauth-start/index.ts
supabase/functions/gmail-oauth-callback/index.ts
supabase/functions/gmail-connection-status/index.ts
supabase/functions/gmail-test-connection/index.ts
supabase/functions/gmail-disconnect/index.ts
src/services/gmailIntegracionService.js
src/modules/documentos/components/ConsignacionesFacturasAdmin.jsx
```

## Instalación en Supabase

### 1. Ejecutar SQL

Abre Supabase > SQL Editor y ejecuta:

```text
supabase/2026-07-11-fase36a-gmail-api-infraestructura.sql
```

### 2. Crear proyecto OAuth en Google Cloud

1. Crea o selecciona un proyecto.
2. Activa `Gmail API`.
3. Configura la pantalla de consentimiento OAuth.
4. Durante pruebas, registra la cuenta que se conectará como usuario de prueba.
5. Crea una credencial OAuth tipo `Aplicación web`.
6. Si la aplicación está en estado **Testing** y el tipo de usuario es externo, agrega la cuenta de Gmail en `Test users`.
7. Agrega como URI de redirección autorizado:

```text
https://TU-PROYECTO.supabase.co/functions/v1/gmail-oauth-callback
```

La dirección debe coincidir exactamente con `GOOGLE_GMAIL_REDIRECT_URI`.

> **Importante durante pruebas:** en un proyecto OAuth externo con estado `Testing`, Google normalmente emite refresh tokens con vencimiento de 7 días cuando se solicitan permisos de Gmail. Durante esta etapa puede ser necesario reconectar semanalmente. Antes de dejar la automatización funcionando de forma permanente se deberá revisar el paso a producción y los requisitos de verificación de Google.

### 3. Configurar secretos de Edge Functions

```bash
supabase secrets set GOOGLE_GMAIL_CLIENT_ID="..."
supabase secrets set GOOGLE_GMAIL_CLIENT_SECRET="..."
supabase secrets set GOOGLE_GMAIL_REDIRECT_URI="https://TU-PROYECTO.supabase.co/functions/v1/gmail-oauth-callback"
supabase secrets set RAFIKI_APP_URL="https://TU-APP.vercel.app"
supabase secrets set GMAIL_TOKEN_ENCRYPTION_KEY="$(openssl rand -base64 32)"
```

Conserva la clave de cifrado en un gestor seguro. Si se pierde o cambia, el refresh token almacenado dejará de poder descifrarse y será necesario reconectar Gmail.

### 4. Desplegar funciones

```bash
supabase functions deploy gmail-oauth-start
supabase functions deploy gmail-oauth-callback --no-verify-jwt
supabase functions deploy gmail-connection-status
supabase functions deploy gmail-test-connection
supabase functions deploy gmail-disconnect
```

El archivo `supabase/config.toml` ya declara el callback como función pública. Las demás funciones mantienen verificación JWT.

### 5. Desplegar Rafiki

Sube el proyecto a GitHub/Vercel manteniendo las variables existentes:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

No agregues Google Client Secret, service role ni refresh token en Vercel o React.

## Prueba funcional

1. Inicia sesión en Rafiki como Administrador.
2. Ve a `Gerencia > Consignaciones y facturas`.
3. Presiona `Conectar Gmail`.
4. Autoriza la cuenta correcta.
5. Confirma que Rafiki muestre el correo conectado.
6. Presiona `Probar conexión`.
7. Confirma que se actualice la fecha de última prueba.
8. Prueba `Desconectar Gmail` y vuelve a conectar.

## Seguridad

Las tablas OAuth tienen RLS habilitado y no conceden permisos a `anon` ni `authenticated`. Solo las Edge Functions con service role pueden leer el refresh token cifrado. El navegador recibe únicamente estado, correo autorizado y fechas de conexión.
