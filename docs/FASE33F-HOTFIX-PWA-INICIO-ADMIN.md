# Fase 33F Hotfix — PWA inicia obligatoriamente en Admin

Fecha: 2026-06-20  
Versión: 123.2-PWA-INICIO-ADMIN-OBLIGATORIO-2026-06-20

## Objetivo

Garantizar que la PWA instalada de Rafiki Pedidos abra por defecto en `/admin`, no en `/mesas`, aunque el navegador use el manifest generado por VitePWA.

## Cambios aplicados

- `vite.config.js`:
  - `rafikiManifest.id` pasa de `/mesas` a `/admin`.
  - `rafikiManifest.start_url` pasa de `/mesas` a `/admin?app=admin`.
- `public/manifest.json`:
  - Se conserva `id: /admin`.
  - Se conserva `start_url: /admin?app=admin`.
  - Se ajusta descripción para dejar claro que la PWA inicia en el panel administrativo.
- `src/shared/utils/pwaRecovery.js`:
  - Si se limpia caché desde una ruta pública o raíz, redirige a `/admin`.
- `src/shared/components/InstallPWA.jsx`:
  - Se actualiza comentario operativo de instalación PWA.
- `public/rafiki-version.json` y `src/config/rafikiBuild.js`:
  - Versión actualizada a `123.2`.

## Importante después de desplegar

En celulares donde la PWA ya esté instalada, puede quedar guardado el `start_url` anterior del manifest. Para obligar el cambio en esos dispositivos, se recomienda:

1. Abrir la app desde el navegador.
2. Usar el botón de limpiar caché si aparece.
3. Si sigue abriendo en `/mesas`, eliminar el acceso instalado de la pantalla de inicio e instalar nuevamente.

Esto no afecta la navegación interna: desde `/admin` se puede seguir entrando a `/mesas` con el botón correspondiente.
