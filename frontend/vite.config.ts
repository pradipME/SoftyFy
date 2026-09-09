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
      strategies: 'injectManifest',
      includeAssets: ['favicon.png'],
      srcDir: 'src',
      filename: 'sw.ts',
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
      injectManifest: {
        // Precache the app shell + build assets only. The full library is
        // ~350 MB of mp3s, so audio (and covers) are cached lazily at runtime
        // instead of being precached — keeping install/update light.
        swSrc: 'src/sw.ts',
        globPatterns: ['**/*.{js,css,html}'],
        globIgnores: ['sw.js', 'workbox-*.js'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
})
