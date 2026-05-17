# Fase 13 — Infraestructura estable

## Cambios aplicados

1. Service Worker limpiado y estabilizado en `public/sw.js`.
   - Nueva versión: `fase13-2026-05-17`.
   - Limpieza automática de cachés antiguas `rafiki-pedidos-*`.
   - Navegación siempre con estrategia red primero para evitar React viejo después de desplegar.
   - Manifest y `sw.js` también van red primero.
   - Assets estáticos van caché primero.
   - Nunca devuelve `undefined`; si no hay red ni caché, responde 503 controlado.
   - Supabase queda excluido del Service Worker.

2. Registro del Service Worker mejorado en `src/registerSW.js`.
   - Usa `/sw.js?v=fase13-2026-05-17` para forzar actualización.
   - Usa `updateViaCache: 'none'`.
   - Detecta nuevo Service Worker y recarga una sola vez cuando toma control.

3. Manifest versionado desde `index.html`.
   - Se cambió `manifest.json?v=mesas1` por `manifest.json?v=fase13-2026-05-17`.

4. Headers para Vercel en `vercel.json`.
   - `sw.js` y `manifest.json` quedan sin caché fuerte.
   - Iconos quedan cacheables porque son estáticos.

5. Validación realizada.
   - `manifest.json` válido.
   - `vercel.json` válido.
   - `public/sw.js` sin errores de sintaxis.
   - `src/registerSW.js` sin errores de sintaxis.
   - Iconos encontrados y con tamaños correctos:
     - `icon-180.png`: 180x180
     - `icon-192.png`: 192x192
     - `icon-512.png`: 512x512

## Prueba recomendada después de desplegar

1. Subir este ZIP a GitHub sin agregar `package-lock.json`.
2. En Vercel hacer redeploy.
3. Abrir la app en navegador.
4. En Chrome/Edge: DevTools > Application > Service Workers.
5. Confirmar que el Service Worker activo apunte a `fase13-2026-05-17`.
6. En Application > Cache Storage confirmar que solo quede un caché tipo `rafiki-pedidos-fase13-2026-05-17`.
7. En celular, cerrar y abrir la PWA instalada. Si sigue vieja, eliminar el acceso de pantalla de inicio e instalar nuevamente.

## Siguiente paso sugerido

Antes de dividir `App.jsx`, probar esta versión en escritorio y celular. Si desaparecen los errores raros, proceder con Fase 13B: división segura de `App.jsx` por módulos pequeños.
