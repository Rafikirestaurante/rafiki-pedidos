const SW_URL = '/sw.js?v=fase13-2026-05-17';

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(SW_URL, {
        scope: '/',
        updateViaCache: 'none'
      });

      registration.update?.();

      registration.addEventListener('updatefound', () => {
        const nuevoSW = registration.installing;
        if (!nuevoSW) return;

        nuevoSW.addEventListener('statechange', () => {
          if (nuevoSW.state === 'installed' && navigator.serviceWorker.controller) {
            nuevoSW.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });
    } catch (error) {
      console.warn('No se pudo registrar el service worker:', error);
    }
  });

  let recargaRealizada = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (recargaRealizada) return;
    recargaRealizada = true;
    window.location.reload();
  });
}
