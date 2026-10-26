import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

// The app is served from https://<user>.github.io/Hanzi/
export default defineConfig({
  base: '/Hanzi/',
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Hanzi — Chinese vocabulary',
        short_name: 'Hanzi',
        description: 'Learn HSK vocabulary with flashcards and spaced repetition.',
        lang: 'en',
        theme_color: '#b23a2e',
        background_color: '#faf8f5',
        display: 'standalone',
        start_url: '/Hanzi/',
        scope: '/Hanzi/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json,woff2}'],
        runtimeCaching: [
          {
            // Google Fonts: cache the stylesheet and every font slice once used, for offline use
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
