import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

function sitemapPlugin(): Plugin {
  return {
    name: 'sitemap-generator',
    apply: 'build',
    closeBundle() {
      try {
        const scriptPath = path.resolve(__dirname, './scripts/generate-sitemap.mjs');
        import(scriptPath).then((m) => {
          if (typeof m.generateSitemap === 'function') {
            m.generateSitemap();
          }
        }).catch((err) => {
          console.warn('[sitemapPlugin] Sitemap generation deferred:', err);
        });
      } catch (e) {
        console.warn('[sitemapPlugin] Error:', e);
      }
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), sitemapPlugin(), 
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /\.(?:mp4|webm|ogg)$/i,
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
            urlPattern: /^https:\/\/storage\.googleapis\.com\/.*/i,
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
    }),],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'motion/react',
        'lucide-react',
        'react-multi-date-picker',
        'react-date-object/calendars/persian',
        'react-date-object/locales/persian_fa',
        'recharts',
        'axios',
        'jszip',
      ],
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
      chunkSizeWarningLimit: 2000,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

