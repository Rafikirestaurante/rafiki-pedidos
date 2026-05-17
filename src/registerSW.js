const SW_URL = '/sw.js?v=fase13b-2026-05-17';

function avisarNuevaVersion(registration) {
  window.dispatchEvent(new CustomEvent('rafiki:nueva-version-disponible', {
    detail: { registration }
  }));
}

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
            avisarNuevaVersion(registration);
          }
        });
      });
    } catch (error) {
      console.warn('No se pudo registrar el service worker:', error);
    }
  });
}

export function activarNuevaVersion(registration) {
  const waiting = registration?.waiting || registration?.installing;
  if (waiting) {
    waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  window.location.reload();
}
