import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

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
    plugins: [react(), tailwindcss(), sitemapPlugin()],
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

