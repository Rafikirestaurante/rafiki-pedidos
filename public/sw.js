/* Rafiki Pedidos - Service Worker Fase 13B
   Objetivo: estabilidad. Evita index viejo, limpia cachés anteriores y nunca responde undefined. */
const SW_VERSION = 'fase13b-2026-05-17';
const CACHE_NAME = `rafiki-pedidos-${SW_VERSION}`;

const APP_SHELL = [
  '/',
  '/manifest.json',
  '/logo-rafiki.png',
  '/icon-180.png',
  '/icon-192.png',
  '/icon-512.png'
];

const esMismoOrigen = (url) => url.origin === self.location.origin;
const esSupabase = (url) => url.hostname.includes('supabase');
const esArchivoEstatico = (request, url) =>
  esMismoOrigen(url) &&
  request.destination !== 'document' &&
  !url.pathname.endsWith('/index.html') &&
  !url.pathname.endsWith('/sw.js');

async function cachearSiValido(request, response) {
  if (!response || !response.ok || response.type === 'opaque') return;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
}

async function desdeRedConFallback(request) {
  const cached = await caches.match(request);
  try {
    const response = await fetch(request, { cache: 'no-store' });
    await cachearSiValido(request, response);
    return response;
  } catch (error) {
    return cached || new Response('Sin conexión y sin caché disponible.', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

async function cachePrimero(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    await cachearSiValido(request, response);
    return response;
  } catch (error) {
    return new Response('Recurso no disponible sin conexión.', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(APP_SHELL.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys
        .filter((key) => key.startsWith('rafiki-pedidos-') && key !== CACHE_NAME)
        .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (esSupabase(url)) return;

  // Navegación: siempre red primero para evitar que Vercel entregue una versión vieja de React.
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => response)
        .catch(async () =>
          (await caches.match('/')) ||
          (await caches.match('/index.html')) ||
          new Response('Rafiki Pedidos no está disponible sin conexión.', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          })
        )
    );
    return;
  }

  // Manifest y service worker: red primero para que iconos, nombre y start_url no queden congelados.
  if (url.pathname.endsWith('/manifest.json') || url.pathname.endsWith('/sw.js')) {
    event.respondWith(desdeRedConFallback(request));
    return;
  }

  // Assets del mismo origen: cache primero. Archivos generados por Vite tienen hash y son seguros de cachear.
  if (esArchivoEstatico(request, url)) {
    event.respondWith(cachePrimero(request));
  }
});
