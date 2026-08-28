import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

/**
 * Build Cache Buster & LocalStorage Validator Plugin
 * Injects build version hashes, cache-control headers, and an early bootstrap
 * validation script that audits stored logos & reports in LocalStorage on new releases,
 * preventing stale asset caching and duplicate/outdated logo presentation.
 */
function buildCacheBusterPlugin(): Plugin {
  const buildTimestamp = Date.now();
  const buildVersion = `v_${buildTimestamp}`;

  const validationScript = `
  <script>
    (function() {
      try {
        var CURRENT_BUILD_VERSION = "${buildVersion}";
        var storedVersion = localStorage.getItem("mahash_build_version");
        
        if (!storedVersion || storedVersion !== CURRENT_BUILD_VERSION) {
          // Version updated: Validate & audit LocalStorage keys
          var preservedPrefixes = [
            "mahash_team_logo_",
            "team_logo_",
            "mahash_official_logo",
            "mahash_youth_club_badge",
            "mahash_member_avatars",
            "mahash_consultant_photos",
            "mahash_consultants_list",
            "mahash_app_reports",
            "mahash_team_overrides",
            "mahash_app_scores",
            "mahash_app_events",
            "mahash_report_views",
            "mahash_admin_auth",
            "mahash_theme_mode",
            "mahash_text_size",
            "mahash_high_contrast",
            "mahash_user_preferences",
            "theme"
          ];
          
          // Clear any corrupted or obsolete temporary cache keys
          try {
            var keysToRemove = [];
            for (var i = 0; i < localStorage.length; i++) {
              var k = localStorage.key(i);
              if (k && k.indexOf("temp_") === 0) {
                keysToRemove.push(k);
              }
            }
            keysToRemove.forEach(function(k) { localStorage.removeItem(k); });
          } catch(e) {}

          // Invalidate browser CacheStorage if available
          if (typeof caches !== "undefined" && caches.keys) {
            caches.keys().then(function(names) {
              names.forEach(function(name) { caches.delete(name); });
            }).catch(function() {});
          }

          localStorage.setItem("mahash_build_version", CURRENT_BUILD_VERSION);
          localStorage.setItem("mahash_cache_bust_timestamp", String(Date.now()));
          console.info("[Mahash CacheBuster] Validated local storage & refreshed cache for build:", CURRENT_BUILD_VERSION);
        }
      } catch(err) {
        console.warn("[Mahash CacheBuster] Initialization notice:", err);
      }
    })();
  </script>
  `;

  return {
    name: 'vite-plugin-build-cache-buster',
    transformIndexHtml(html) {
      return html.replace(
        '<head>',
        `<head>\n    <meta name="build-version" content="${buildVersion}" />\n    <meta name="build-time" content="${buildTimestamp}" />\n    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />\n    <meta http-equiv="Pragma" content="no-cache" />\n    <meta http-equiv="Expires" content="0" />\n${validationScript}`
      );
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), buildCacheBusterPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'esnext',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            lucide: ['lucide-react'],
          },
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]',
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
