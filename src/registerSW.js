import { registerSW } from 'virtual:pwa-register';

let actualizarPWA = null;

function avisarNuevaVersion(versionRemota = '') {
  window.dispatchEvent(
    new CustomEvent('rafiki:nueva-version-disponible', {
      detail: {
        versionRemota,
        actualizar: () => actualizarPWA?.(true)
      }
    })
  );
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  actualizarPWA = registerSW({
    immediate: true,
    onNeedRefresh() {
      avisarNuevaVersion();
    },
    onOfflineReady() {
      window.dispatchEvent(new CustomEvent('rafiki:pwa-lista-offline'));
    },
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      const revisarSW = () => registration.update().catch(() => undefined);
      revisarSW();
      window.addEventListener('online', revisarSW);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') revisarSW();
      });
    },
    onRegisterError(error) {
      console.warn('No se pudo registrar el service worker:', error);
    }
  });
}

export function activarNuevaVersion(registrationOrUpdater) {
  if (typeof registrationOrUpdater === 'function') {
    registrationOrUpdater(true);
    return;
  }

  if (actualizarPWA) {
    actualizarPWA(true);
  }
}
