const fs = require('fs');
let content = fs.readFileSync('vite.config.ts', 'utf8');

if (!content.includes('VitePWA')) {
  content = content.replace(
    "import { defineConfig, Plugin } from 'vite';",
    "import { defineConfig, Plugin } from 'vite';\nimport { VitePWA } from 'vite-plugin-pwa';"
  );

  const pwaConfig = `
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /\\.(?:mp4|webm|ogg)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mahash-video-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
              },
              cacheableResponse: {
                statuses: [0, 200, 206],
              },
              // Use range requests plugin for video streaming compatibility
              plugins: [
                {
                  cachedResponseWillBeUsed: async ({ cachedResponse }) => {
                    return cachedResponse;
                  }
                }
              ]
            },
          },
          {
            urlPattern: /^https:\\/\\/storage\\.googleapis\\.com\\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mahash-cloud-storage-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
              cacheableResponse: {
                statuses: [0, 200, 206],
              },
            }
          }
        ]
      },
      manifest: {
        name: 'سامانه مَهاش',
        short_name: 'مَهاش',
        description: 'مدیریت هوشمند اشیاء',
        theme_color: '#173b82',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/icon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    }),`;

  content = content.replace(
    "plugins: [react(), tailwindcss(), sitemapPlugin()],",
    `plugins: [react(), tailwindcss(), sitemapPlugin(), ${pwaConfig}],`
  );
}

fs.writeFileSync('vite.config.ts', content);
console.log("Patched vite.config.ts");
