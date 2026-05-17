import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const rafikiManifest = {
  id: '/mesas',
  name: 'Rafiki Pedidos',
  short_name: 'Rafiki',
  description: 'Aplicación PWA de Rafiki Pedidos para clientes, mesas, administración y panel Rafa.',
  lang: 'es',
  start_url: '/mesas?app=mesas',
  scope: '/',
  display: 'standalone',
  display_override: ['standalone', 'minimal-ui'],
  orientation: 'portrait',
  background_color: '#fff4e6',
  theme_color: '#f97316',
  categories: ['food', 'business', 'productivity'],
  icons: [
    {
      src: '/icon-192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any maskable'
    },
    {
      src: '/icon-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any maskable'
    }
  ],
  shortcuts: [
    {
      name: 'Nuevo pedido cliente',
      short_name: 'Cliente',
      description: 'Abrir el panel de pedidos para clientes.',
      url: '/cliente?source=pwa-shortcut',
      icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }]
    },
    {
      name: 'Panel mesas',
      short_name: 'Mesas',
      description: 'Abrir el panel de mesas para meseros.',
      url: '/mesas?source=pwa-shortcut',
      icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }]
    },
    {
      name: 'Pedidos de hoy',
      short_name: 'Pedidos',
      description: 'Abrir el panel administrativo de pedidos.',
      url: '/admin?source=pwa-shortcut',
      icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }]
    },
    {
      name: 'Panel Rafa',
      short_name: 'Rafa',
      description: 'Abrir la sección privada del panel Rafa.',
      url: '/rafa?source=pwa-shortcut',
      icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }]
    }
  ]
};

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.ico', 'logo-rafiki.png', 'icon-180.png', 'icon-192.png', 'icon-512.png'],
      manifest: rafikiManifest,
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,webp}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname.includes('supabase.co'),
            handler: 'NetworkOnly',
            method: 'GET',
            options: {
              cacheName: 'rafiki-supabase-network-only'
            }
          },
          {
            urlPattern: ({ request, url }) =>
              request.destination === 'image' || /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'rafiki-images',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          },
          {
            urlPattern: ({ request }) => ['script', 'style', 'font'].includes(request.destination),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'rafiki-static-assets',
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ]
});
