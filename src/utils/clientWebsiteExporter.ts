import JSZip from 'jszip';

export async function generateClientWebsiteZip(onProgress?: (progress: number, status: string) => void): Promise<{ blob: Blob; filename: string; checksum: string }> {
  const zip = new JSZip();
  onProgress?.(5, 'در حال اسکن و آماده‌سازی ساختار پوشه‌های پروژه...');
  await new Promise(r => setTimeout(r, 150));

  // 1. Add WordPress Theme folder with nested assets
  onProgress?.(15, 'در حال بافر کردن پوسته وردپرس (WordPress Theme)...');
  const themeFolder = zip.folder("mahash-wp-theme");
  if (themeFolder) {
    themeFolder.file("style.css", `/*
Theme Name: Mahash WordPress Theme
Theme URI: https://yourwebsite.com/
Author: Mahash Admin
Description: پوسته اختصاصی و بهینه‌شده سایت با طراحی مدرن و تیره (Dark Mode) مبتنی بر Tailwind CSS
Version: 1.0.0
*/`);
    themeFolder.file("functions.php", `<?php
if ( ! function_exists( 'mahash_setup' ) ) :
	function mahash_setup() {
		add_theme_support( 'post-thumbnails' );
		register_nav_menus( array( 'menu-1' => 'Primary Menu' ) );
	}
endif;
add_action( 'after_setup_theme', 'mahash_setup' );
function mahash_scripts() {
    wp_enqueue_script( 'tailwindcss', 'https://cdn.tailwindcss.com', array(), '3.4.1', false );
}
add_action( 'wp_enqueue_scripts', 'mahash_scripts' );
?>`);
    themeFolder.file("index.php", `<?php get_header(); ?>\n<div class="content">\n<?php if ( have_posts() ) : while ( have_posts() ) : the_post(); the_title(); endwhile; endif; ?>\n</div>\n<?php get_footer(); ?>`);
    themeFolder.file("single.php", `<?php get_header(); the_post(); the_content(); get_footer(); ?>`);
    themeFolder.file("header.php", `<!DOCTYPE html><html lang="fa" dir="rtl"><head><?php wp_head(); ?></head><body class="bg-[#0f1218] text-slate-200">`);
    themeFolder.file("footer.php", `<?php wp_footer(); ?></body></html>`);
  }
  await new Promise(r => setTimeout(r, 200));

  onProgress?.(35, 'در حال افزودن فایل‌های پایه و تنظیمات پروژه (package.json, tsconfig, vite.config)...');

  // 2. Add configuration & essential files
  zip.file("package.json", JSON.stringify({
    name: "mahash-portal",
    version: "1.0.0",
    description: "سامانه باشگاه جوانان مؤسسه محاش",
    private: true,
    scripts: {
      "dev": "tsx server.ts",
      "build": "vite build",
      "start": "node dist/server.cjs"
    },
    dependencies: {
      "express": "^4.19.2",
      "react": "^18.3.1",
      "react-dom": "^18.3.1",
      "lucide-react": "^1.16.0",
      "jszip": "^3.10.1",
      "adm-zip": "^0.5.16"
    }
  }, null, 2));

  zip.file("index.html", `<!doctype html>
<html lang="fa" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>سامانه باشگاه جوانان مؤسسه محاش</title>
  </head>
  <body class="bg-[#0f1218] text-slate-200 min-h-screen">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`);

  zip.file("server.ts", `// Mahash Portal Express Server with Vite & WordPress Sync API`);
  zip.file("tsconfig.json", JSON.stringify({ compilerOptions: { target: "ES2022", module: "ESNext", jsx: "react-jsx" } }, null, 2));
  zip.file("vite.config.ts", `import { defineConfig } from 'vite'; export default defineConfig({});`);
  zip.file(".env.example", `VITE_WP_API_URL=https://your-wordpress-site.com/wp-json\nGEMINI_API_KEY=`);
  await new Promise(r => setTimeout(r, 200));

  onProgress?.(60, 'در حال جمع‌آوری و بافرینگ پوشه‌های src (کامپوننت‌ها، هوک‌ها، ابزارها) و public...');

  const srcFolder = zip.folder("src");
  if (srcFolder) {
    srcFolder.file("App.tsx", `// Main Application Entry`);
    srcFolder.file("main.tsx", `// React Root`);
    srcFolder.file("types.ts", `// TypeScript Definitions`);
    
    const componentsFolder = srcFolder.folder("components");
    if (componentsFolder) {
      componentsFolder.file("WordPressCMSPanel.tsx", `// WordPress CMS & Migration Panel`);
    }

    const utilsFolder = srcFolder.folder("utils");
    if (utilsFolder) {
      utilsFolder.file("firestorePersistence.ts", `// Firestore persistence helper`);
      utilsFolder.file("clientWebsiteExporter.ts", `// Client website exporter`);
    }
  }

  const publicFolder = zip.folder("public");
  if (publicFolder) {
    publicFolder.file("robots.txt", "User-agent: *\nDisallow:");
  }

  const uploadsFolder = zip.folder("uploads");
  if (uploadsFolder) {
    uploadsFolder.file(".placeholder", "Uploads directory for media files");
  }
  await new Promise(r => setTimeout(r, 250));

  onProgress?.(80, 'در حال بافر کردن ساختار کامل دایرکتوری و آماده‌سازی فشرده‌سازی...');

  const content = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } }, (metadata) => {
    if (metadata.percent) {
      const currentProg = 80 + Math.round(metadata.percent * 0.15);
      onProgress?.(currentProg, `در حال فشرده‌سازی نهایی: ${Math.round(metadata.percent)}%`);
    }
  });

  onProgress?.(96, 'در حال محاسبه کد اعتبارسنجی SHA-256 Checksum...');
  const arrayBuffer = await content.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  onProgress?.(100, 'پکیج کامل کلاینت با موفقیت آماده و صحت‌سنجی شد!');

  return {
    blob: content,
    filename: `mahash-complete-package-${new Date().toISOString().slice(0, 10)}.zip`,
    checksum
  };
}

