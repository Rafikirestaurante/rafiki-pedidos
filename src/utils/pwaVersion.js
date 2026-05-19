export const RAFIKI_APP_VERSION = '17D-ADMIN-ESTABLE-2026-05-18';
export const RAFIKI_VERSION_URL = '/rafiki-version.json';
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

function convertirVersionANumero(version = '') {
  const texto = String(version).toUpperCase();
  const coincidenciaFase = texto.match(/(\d+)(?:\s*)?([A-Z])?(?:[-_ ]?(\d+))?/);

  if (!coincidenciaFase) return 0;

  const fase = Number(coincidenciaFase[1] || 0);
  const letra = coincidenciaFase[2] ? coincidenciaFase[2].charCodeAt(0) - 64 : 0;
  const subfase = Number(coincidenciaFase[3] || 0);
  const fix = texto.includes('FIX') ? 1 : 0;

  return fase * 1000000 + letra * 10000 + subfase * 100 + fix;
}

export function esVersionRemotaMasNueva(versionRemota, versionActual = RAFIKI_APP_VERSION) {
  if (!versionRemota || versionRemota === versionActual) return false;

  const numeroRemoto = convertirVersionANumero(versionRemota);
  const numeroActual = convertirVersionANumero(versionActual);

  if (!numeroRemoto || !numeroActual) return false;

  return numeroRemoto > numeroActual;
}

export async function consultarVersionRemota() {
  const respuesta = await fetch(`${RAFIKI_VERSION_URL}?t=${Date.now()}`, {
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
  const url = new URL(window.location.href);
  url.searchParams.set('rafiki_refresh', Date.now().toString());
  window.location.replace(url.toString());
}
