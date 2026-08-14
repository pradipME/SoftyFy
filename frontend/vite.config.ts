import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png'],
      manifest: {
        id: '/',
        name: 'SoftyFy',
        short_name: 'SoftyFy',
        description:
          'SoftyFy — a static, offline-friendly Spotify-style player for your personal music collection.',
        theme_color: '#121212',
        background_color: '#121212',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'en',
        categories: ['music', 'entertainment'],
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache the app shell + build assets only. The full library is
        // ~225 MB of mp3s, so audio (and covers) are cached lazily at runtime
        // instead of being precached — keeping install/update light.
        globPatterns: ['**/*.{js,css,html}'],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Covers: cached on first sight, then served instantly (CacheFirst).
            urlPattern: /\/covers\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'softyfy-covers',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Audio: cached only after a song is played (CacheFirst with Range
            // support so seeking works offline). maxEntries bounds the cache so
            // the collection never forces a huge one-time download.
            urlPattern: /\/audio\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'softyfy-audio',
              rangeRequests: true,
              expiration: {
                maxEntries: 40,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
