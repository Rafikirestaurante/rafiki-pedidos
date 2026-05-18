export const RAFIKI_APP_VERSION = '15A-LIMPIEZA-UI-2026-05-18';

export const RAFIKI_VERSION_STORAGE_KEY = 'rafikiAppVersion';

export function obtenerVersionGuardada(storage = window.localStorage) {
  try {
    return storage.getItem(RAFIKI_VERSION_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function guardarVersionActual(storage = window.localStorage) {
  try {
    storage.setItem(RAFIKI_VERSION_STORAGE_KEY, RAFIKI_APP_VERSION);
  } catch {
    // Si el navegador bloquea localStorage, la app debe seguir funcionando.
  }
}

export function esVersionRemotaMasNueva(versionRemota, versionActual = RAFIKI_APP_VERSION) {
  return Boolean(versionRemota && versionRemota !== versionActual);
}

export async function consultarVersionRemota() {
  const respuesta = await fetch(`/rafiki-version.json?t=${Date.now()}`, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache'
    }
  });

  if (!respuesta.ok) {
    throw new Error(`No se pudo consultar versión (${respuesta.status})`);
  }

  return respuesta.json();
}

export async function limpiarCachesPWA() {
  if ('caches' in window) {
    const nombres = await window.caches.keys();
    await Promise.all(
      nombres
        .filter((nombre) => /rafiki|workbox|vite|pwa|precache|runtime/i.test(nombre))
        .map((nombre) => window.caches.delete(nombre))
    );
  }

  if ('serviceWorker' in navigator) {
    const registros = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registros.map((registro) => registro.unregister()));
  }
}

export async function limpiarCachesYRecargar() {
  await limpiarCachesPWA();
  guardarVersionActual();
  const separador = window.location.href.includes('?') ? '&' : '?';
  window.location.replace(`${window.location.href}${separador}rafiki_refresh=${Date.now()}`);
}
