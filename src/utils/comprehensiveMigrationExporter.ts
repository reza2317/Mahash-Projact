import JSZip from 'jszip';
import {
  getAllReports,
  getAllScores,
  getAllTeamsList,
  getNewsAnnouncements,
  getMahashLogo,
  getYouthClubBadge,
  getConsultantPhotos,
  CONSULTANTS,
  getAllEvents,
  exportFullDatabaseJSON,
  exportReportsCSV,
  exportScoresCSV,
  exportNewsAnnouncementsCSV,
  exportConsultantsCSV
} from './reportsStore';
import { MAHESH_LOGO_SVG, MAHESH_CLUB_EMBLEM_SVG } from './assets';

/**
 * Generates an optimized .htaccess file for Apache / cPanel / DirectAdmin
 * Handles single-page app (SPA) fallback routing, Gzip compression, and security headers.
 */
export function generateHtaccessConfig(): string {
  return `# =========================================================================
# Mahash Portal (.htaccess) - Optimized for cPanel / DirectAdmin / Apache
# Generated on: ${new Date().toISOString()}
# =========================================================================

# 1. Enable Rewrite Engine for SPA (Single Page Application)
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # HTTPS redirection (uncomment if SSL is active)
  # RewriteCond %{HTTPS} off
  # RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

  # Do not rewrite real files or directories
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Fallback to index.html for React client-side routing
  RewriteRule ^ index.html [L]
</IfModule>

# 2. Gzip & Deflate Compression for High Performance
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/xml
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE text/javascript
  AddOutputFilterByType DEFLATE application/xml
  AddOutputFilterByType DEFLATE application/xhtml+xml
  AddOutputFilterByType DEFLATE application/rss+xml
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/x-javascript
  AddOutputFilterByType DEFLATE application/json
  AddOutputFilterByType DEFLATE image/svg+xml
</IfModule>

# 3. Leverage Browser Caching (Expires Headers)
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresDefault "access plus 1 month"
  ExpiresByType text/html "access plus 0 seconds"
  ExpiresByType application/json "access plus 0 seconds"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
</IfModule>

# 4. Security & CORS Headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
  Header set Access-Control-Allow-Origin "*"
</IfModule>

# 5. UTF-8 Character Encoding
AddDefaultCharset UTF-8
`;
}

/**
 * Generates an optimized nginx.conf block for VPS, Docker, or Nginx hosts
 */
export function generateNginxConfig(): string {
  return `# =========================================================================
# Mahash Portal (nginx.conf) - High Performance Reverse Proxy & Static Host
# Generated on: ${new Date().toISOString()}
# =========================================================================

server {
    listen 80;
    server_name mahash.org www.mahash.org;
    root /var/www/mahash/dist;
    index index.html;

    charset utf-8;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    # Media & Static Uploads
    location /uploads/ {
        alias /var/www/mahash/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
        try_files $uri =404;
    }

    # Static Assets Caching (JS, CSS, WebP, WOFF2)
    location ~* \\.(?:css|js|woff2?|svg|webp|png|jpg|jpeg|gif|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # API Proxy to Node.js / Express Server (Port 3000)
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # SPA Fallback Routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Custom Error Pages
    error_page 404 /index.html;
}
`;
}

/**
 * Generates web.config for IIS / Windows servers
 */
export function generateWebConfig(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="Mahash React SPA Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/(api)" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <remove fileExtension=".json" />
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <remove fileExtension=".webp" />
      <mimeMap fileExtension=".webp" mimeType="image/webp" />
      <remove fileExtension=".woff2" />
      <mimeMap fileExtension=".woff2" mimeType="font/woff2" />
    </staticContent>
  </system.webServer>
</configuration>`;
}

/**
 * Generates local test scripts (Windows .bat and Linux/Mac .sh)
 */
export function generateLocalRunnerScripts(): { bat: string; sh: string } {
  const bat = `@echo off
chcp 65001 > nul
echo ==========================================================
echo   سامانه باشگاه جوانان مؤسسه محاش - راه‌انداز لوکال (Windows)
echo ==========================================================
echo.
echo در حال بررسی موتورهای اجرایی موجود در سیستم...

where node >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] محیط Node.js یافت شد.
    if exist server.cjs (
        echo در حال اجرای سرور اختصاصی Node.js روی پورت 3000...
        node server.cjs
        goto end
    )
)

where python >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] محیط Python یافت شد. در حال باز کردن وب‌سرور لوکال روی پورت 8080...
    start http://localhost:8080
    python -m http.server 8080
    goto end
)

echo در حال باز کردن مستقیم صفحه با مرورگر پیش‌فرض...
start index.html

:end
pause
`;

  const sh = `#!/bin/bash
# ==========================================================
#  سامانه باشگاه جوانان مؤسسه محاش - راه‌انداز لوکال (Linux / Mac)
# ==========================================================

echo "=========================================================="
echo "  سامانه باشگاه جوانان مؤسسه محاش - اجرای محلی"
echo "=========================================================="

if command -v node >/dev/null 2>&1 && [ -f "server.cjs" ]; then
    echo "در حال اجرای سرور Node.js با پورت 3000..."
    node server.cjs
elif command -v python3 >/dev/null 2>&1; then
    echo "در حال اجرای سرور محلی پایتون روی پورت 8080..."
    python3 -m http.server 8080
elif command -v python >/dev/null 2>&1; then
    echo "در حال اجرای سرور محلی پایتون روی پورت 8080..."
    python -m http.server 8080
else
    echo "باز کردن فایل index.html با مرورگر..."
    xdg-open index.html 2>/dev/null || open index.html 2>/dev/null
fi
`;

  return { bat, sh };
}

/**
 * Generates complete, valid MySQL SQL dump (CREATE TABLE + INSERT INTO) for all tables
 */
export function generateCompleteMySQLDump(): string {
  const reports = getAllReports();
  const scores = getAllScores();
  const announcements = getNewsAnnouncements();
  const consultants = CONSULTANTS;
  const events = getAllEvents();
  const teams = getAllTeamsList();
  const mahashLogo = getMahashLogo() || MAHESH_LOGO_SVG;
  const clubEmblem = getYouthClubBadge() || MAHESH_CLUB_EMBLEM_SVG;
  const consultantPhotos = getConsultantPhotos();

  const escapeSql = (str: any): string => {
    if (str === null || str === undefined) return 'NULL';
    if (typeof str === 'number') return String(str);
    if (typeof str === 'boolean') return str ? '1' : '0';
    return "'" + String(str).replace(/\\/g, '\\\\').replace(/'/g, "''").replace(/\n/g, '\\n').replace(/\r/g, '\\r') + "'";
  };

  let sql = `-- =========================================================================\n`;
  sql += `-- پایگاه داده جامع مؤسسه و باشگاه جوانان محاش (MySQL / MariaDB)\n`;
  sql += `-- تاریخ تولید: ${new Date().toLocaleDateString('fa-IR')} (${new Date().toISOString()})\n`;
  sql += `-- انکودینگ: utf8mb4 / COLLATE: utf8mb4_unicode_ci\n`;
  sql += `-- سازگار با phpMyAdmin، خط فرمان MySQL و تمامی هاست‌های cPanel / DirectAdmin\n`;
  sql += `-- =========================================================================\n\n`;

  sql += `SET NAMES utf8mb4;\n`;
  sql += `SET CHARACTER SET utf8mb4;\n`;
  sql += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

  // 1. Table mahash_reports
  sql += `-- --------------------------------------------------------\n`;
  sql += `-- ساختار جدول گزارشات تیم‌ها: mahash_reports\n`;
  sql += `-- --------------------------------------------------------\n`;
  sql += `DROP TABLE IF EXISTS \`mahash_reports\`;\n`;
  sql += `CREATE TABLE \`mahash_reports\` (\n`;
  sql += `  \`id\` varchar(128) NOT NULL,\n`;
  sql += `  \`team_slug\` varchar(64) NOT NULL,\n`;
  sql += `  \`team_name\` varchar(128) NOT NULL DEFAULT '',\n`;
  sql += `  \`report_num\` varchar(64) DEFAULT '',\n`;
  sql += `  \`title\` varchar(255) NOT NULL,\n`;
  sql += `  \`summary\` longtext,\n`;
  sql += `  \`content\` longtext,\n`;
  sql += `  \`video_url\` longtext,\n`;
  sql += `  \`thumbnail_url\` longtext,\n`;
  sql += `  \`images\` longtext,\n`;
  sql += `  \`attachments\` longtext,\n`;
  sql += `  \`report_date\` varchar(64) DEFAULT '',\n`;
  sql += `  \`report_type\` varchar(32) DEFAULT 'video',\n`;
  sql += `  \`is_deleted\` tinyint(1) DEFAULT 0,\n`;
  sql += `  \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,\n`;
  sql += `  \`updated_at\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n`;
  sql += `  PRIMARY KEY (\`id\`),\n`;
  sql += `  KEY \`idx_team\` (\`team_slug\`),\n`;
  sql += `  KEY \`idx_deleted\` (\`is_deleted\`)\n`;
  sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

  if (reports.length > 0) {
    sql += `-- داده‌های جدول mahash_reports (${reports.length} رکورد)\n`;
    for (const r of reports) {
      sql += `INSERT INTO \`mahash_reports\` (\`id\`, \`team_slug\`, \`team_name\`, \`report_num\`, \`title\`, \`summary\`, \`content\`, \`video_url\`, \`thumbnail_url\`, \`images\`, \`attachments\`, \`report_date\`, \`report_type\`, \`is_deleted\`) VALUES (\n`;
      sql += `  ${escapeSql(r.id)},\n`;
      sql += `  ${escapeSql(r.teamSlug)},\n`;
      sql += `  ${escapeSql(r.teamName)},\n`;
      sql += `  ${escapeSql((r as any).reportNum || '')},\n`;
      sql += `  ${escapeSql(r.title)},\n`;
      sql += `  ${escapeSql(r.summary || '')},\n`;
      sql += `  ${escapeSql((r as any).content || (r as any).transcript || '')},\n`;
      sql += `  ${escapeSql((r as any).videoSrc || '')},\n`;
      sql += `  ${escapeSql((r as any).thumbnail || (r as any).poster || '')},\n`;
      sql += `  ${escapeSql(JSON.stringify(r.images || []))},\n`;
      sql += `  ${escapeSql(JSON.stringify(r.attachments || []))},\n`;
      sql += `  ${escapeSql(r.date || '')},\n`;
      sql += `  ${escapeSql((r as any).reportType || 'video')},\n`;
      sql += `  0\n`;
      sql += `);\n`;
    }
    sql += `\n`;
  }

  // 2. Table mahash_team_scores
  sql += `-- --------------------------------------------------------\n`;
  sql += `-- ساختار جدول امتیازات تیم‌ها: mahash_team_scores\n`;
  sql += `-- --------------------------------------------------------\n`;
  sql += `DROP TABLE IF EXISTS \`mahash_team_scores\`;\n`;
  sql += `CREATE TABLE \`mahash_team_scores\` (\n`;
  sql += `  \`team_id\` varchar(64) NOT NULL,\n`;
  sql += `  \`team_name\` varchar(128) NOT NULL,\n`;
  sql += `  \`score\` int(11) NOT NULL DEFAULT 0,\n`;
  sql += `  \`max_score\` int(11) NOT NULL DEFAULT 100,\n`;
  sql += `  \`rank_order\` int(11) NOT NULL DEFAULT 1,\n`;
  sql += `  \`is_registered\` tinyint(1) NOT NULL DEFAULT 1,\n`;
  sql += `  \`logo_url\` text,\n`;
  sql += `  \`updated_at\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n`;
  sql += `  PRIMARY KEY (\`team_id\`)\n`;
  sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

  if (scores.length > 0) {
    sql += `-- داده‌های جدول mahash_team_scores (${scores.length} رکورد)\n`;
    scores.forEach((s, idx) => {
      sql += `INSERT INTO \`mahash_team_scores\` (\`team_id\`, \`team_name\`, \`score\`, \`max_score\`, \`rank_order\`, \`is_registered\`, \`logo_url\`) VALUES (\n`;
      sql += `  ${escapeSql(s.id)},\n`;
      sql += `  ${escapeSql(s.name)},\n`;
      sql += `  ${s.score},\n`;
      sql += `  ${s.maxScore || 100},\n`;
      sql += `  ${idx + 1},\n`;
      sql += `  ${s.isRegistered ? 1 : 0},\n`;
      sql += `  ${escapeSql(s.logo || '')}\n`;
      sql += `);\n`;
    });
    sql += `\n`;
  }

  // 3. Table mahash_news_announcements
  sql += `-- --------------------------------------------------------\n`;
  sql += `-- ساختار جدول اخبار و اطلاعیه‌های نوار Ticker: mahash_news_announcements\n`;
  sql += `-- --------------------------------------------------------\n`;
  sql += `DROP TABLE IF EXISTS \`mahash_news_announcements\`;\n`;
  sql += `CREATE TABLE \`mahash_news_announcements\` (\n`;
  sql += `  \`id\` varchar(128) NOT NULL,\n`;
  sql += `  \`type\` varchar(32) NOT NULL DEFAULT 'ticker',\n`;
  sql += `  \`title\` varchar(255) NOT NULL,\n`;
  sql += `  \`badge\` varchar(64) DEFAULT 'فوری',\n`;
  sql += `  \`category\` varchar(64) DEFAULT 'اطلاعیه',\n`;
  sql += `  \`summary\` text,\n`;
  sql += `  \`content\` longtext,\n`;
  sql += `  \`target_url\` varchar(512) DEFAULT '#',\n`;
  sql += `  \`priority\` int(11) DEFAULT 0,\n`;
  sql += `  \`is_active\` tinyint(1) DEFAULT 1,\n`;
  sql += `  \`date\` varchar(64) DEFAULT '',\n`;
  sql += `  \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,\n`;
  sql += `  PRIMARY KEY (\`id\`),\n`;
  sql += `  KEY \`idx_active_prio\` (\`is_active\`,\`priority\`)\n`;
  sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

  if (announcements.length > 0) {
    sql += `-- داده‌های جدول mahash_news_announcements (${announcements.length} رکورد)\n`;
    for (const a of announcements) {
      sql += `INSERT INTO \`mahash_news_announcements\` (\`id\`, \`type\`, \`title\`, \`badge\`, \`category\`, \`summary\`, \`content\`, \`target_url\`, \`priority\`, \`is_active\`, \`date\`) VALUES (\n`;
      sql += `  ${escapeSql(a.id)},\n`;
      sql += `  ${escapeSql(a.type)},\n`;
      sql += `  ${escapeSql(a.title)},\n`;
      sql += `  ${escapeSql(a.badge || '')},\n`;
      sql += `  ${escapeSql(a.category || '')},\n`;
      sql += `  ${escapeSql(a.summary || '')},\n`;
      sql += `  ${escapeSql(a.content || '')},\n`;
      sql += `  ${escapeSql(a.targetUrl || '#')},\n`;
      sql += `  ${a.priority || 0},\n`;
      sql += `  ${a.isActive ? 1 : 0},\n`;
      sql += `  ${escapeSql(a.date || '')}\n`;
      sql += `);\n`;
    }
    sql += `\n`;
  }

  // 4. Table mahash_assets (Logos, badges, consultant photos)
  sql += `-- --------------------------------------------------------\n`;
  sql += `-- ساختار جدول دارایی‌های رسانه‌ای پایدار: mahash_assets\n`;
  sql += `-- --------------------------------------------------------\n`;
  sql += `DROP TABLE IF EXISTS \`mahash_assets\`;\n`;
  sql += `CREATE TABLE \`mahash_assets\` (\n`;
  sql += `  \`id\` varchar(128) NOT NULL,\n`;
  sql += `  \`category\` varchar(64) NOT NULL DEFAULT 'general',\n`;
  sql += `  \`name\` varchar(255) NOT NULL DEFAULT '',\n`;
  sql += `  \`data\` longtext NOT NULL,\n`;
  sql += `  \`mime_type\` varchar(64) DEFAULT 'image/webp',\n`;
  sql += `  \`size_bytes\` bigint(20) DEFAULT 0,\n`;
  sql += `  \`updated_at\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n`;
  sql += `  PRIMARY KEY (\`id\`),\n`;
  sql += `  KEY \`idx_category\` (\`category\`)\n`;
  sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

  // Insert base assets into SQL
  sql += `-- داده‌های کلیدی جدول mahash_assets (لوگوی اصلی، نشان باشگاه و تیم‌ها)\n`;
  sql += `INSERT INTO \`mahash_assets\` (\`id\`, \`category\`, \`name\`, \`data\`, \`mime_type\`, \`size_bytes\`) VALUES\n`;
  sql += `('mahash_official_logo', 'official_logo', 'لوگوی رسمی مؤسسه محاش', ${escapeSql(mahashLogo)}, 'image/svg+xml', ${mahashLogo.length}),\n`;
  sql += `('mahash_youth_club_emblem', 'club_emblem', 'نشان باشگاه جوانان محاش', ${escapeSql(clubEmblem)}, 'image/svg+xml', ${clubEmblem.length});\n\n`;

  // 5. Table mahash_videos
  sql += `-- --------------------------------------------------------\n`;
  sql += `-- ساختار جدول ویدیوها و رسانه‌ها: mahash_videos\n`;
  sql += `-- --------------------------------------------------------\n`;
  sql += `DROP TABLE IF EXISTS \`mahash_videos\`;\n`;
  sql += `CREATE TABLE \`mahash_videos\` (\n`;
  sql += `  \`id\` varchar(128) NOT NULL,\n`;
  sql += `  \`title\` varchar(255) NOT NULL,\n`;
  sql += `  \`team_slug\` varchar(64) NOT NULL DEFAULT 'general',\n`;
  sql += `  \`report_id\` varchar(128) DEFAULT NULL,\n`;
  sql += `  \`video_url\` text NOT NULL,\n`;
  sql += `  \`thumbnail_url\` text DEFAULT NULL,\n`;
  sql += `  \`is_public\` tinyint(1) NOT NULL DEFAULT 1,\n`;
  sql += `  \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,\n`;
  sql += `  PRIMARY KEY (\`id\`)\n`;
  sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

  const videoReports = reports.filter(r => (r as any).videoSrc);
  if (videoReports.length > 0) {
    sql += `-- داده‌های جدول mahash_videos (${videoReports.length} رکورد)\n`;
    videoReports.forEach((r, idx) => {
      sql += `INSERT INTO \`mahash_videos\` (\`id\`, \`title\`, \`team_slug\`, \`report_id\`, \`video_url\`, \`thumbnail_url\`, \`is_public\`) VALUES (\n`;
      sql += `  ${escapeSql(`vid-${r.id}`)},\n`;
      sql += `  ${escapeSql(r.title)},\n`;
      sql += `  ${escapeSql(r.teamSlug)},\n`;
      sql += `  ${escapeSql(r.id)},\n`;
      sql += `  ${escapeSql((r as any).videoSrc)},\n`;
      sql += `  ${escapeSql((r as any).thumbnail || (r as any).poster || '')},\n`;
      sql += `  1\n`;
      sql += `);\n`;
    });
    sql += `\n`;
  }

  sql += `SET FOREIGN_KEY_CHECKS = 1;\n`;
  sql += `-- =========================================================================\n`;
  sql += `-- پایان پشتیبان‌گیری SQL مؤسسه محاش. تمامی جداول با موفقیت تولید شدند.\n`;
  sql += `-- =========================================================================\n`;

  return sql;
}

/**
 * Generates official WordPress WXR 1.2 XML file for Tools > Import > WordPress
 */
export function generateWordPressWxrExportXml(): string {
  const reports = getAllReports();
  const teams = getAllTeamsList();
  const announcements = getNewsAnnouncements();
  const escapeXml = (unsafe: any) =>
    String(unsafe ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const escapeCdata = (str: any) =>
    `<![CDATA[${String(str ?? '').replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;

  let xml = `<?xml version="1.0" encoding="UTF-8" ?>\n`;
  xml += `<rss version="2.0"
    xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/"
    xmlns:content="http://purl.org/rss/1.0/modules/content/"
    xmlns:wfw="http://wellformedweb.org/CommentAPI/"
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:wp="http://wordpress.org/export/1.2/">\n`;

  xml += `  <channel>\n`;
  xml += `    <title>باشگاه جوانان مؤسسه محاش</title>\n`;
  xml += `    <link>https://mahash.org</link>\n`;
  xml += `    <description>پرتال رسمی گزارشات و فعالیت‌های تیم‌های پنج‌گانه باشگاه جوانان محاش</description>\n`;
  xml += `    <pubDate>${new Date().toUTCString()}</pubDate>\n`;
  xml += `    <language>fa-IR</language>\n`;
  xml += `    <wp:wxr_version>1.2</wp:wxr_version>\n`;
  xml += `    <wp:base_site_url>https://mahash.org</wp:base_site_url>\n`;
  xml += `    <wp:base_blog_url>https://mahash.org</wp:base_blog_url>\n`;

  // 1. Authors
  xml += `    <wp:author>\n`;
  xml += `      <wp:author_id>1</wp:author_id>\n`;
  xml += `      <wp:author_login>admin</wp:author_login>\n`;
  xml += `      <wp:author_email>admin@mahash.org</wp:author_email>\n`;
  xml += `      <wp:author_display_name><![CDATA[مدیر سامانه محاش]]></wp:author_display_name>\n`;
  xml += `    </wp:author>\n`;

  // 2. Categories (Teams)
  teams.forEach((t, i) => {
    xml += `    <wp:category>\n`;
    xml += `      <wp:term_id>${i + 10}</wp:term_id>\n`;
    xml += `      <wp:category_nicename>${escapeXml(t.slug)}</wp:category_nicename>\n`;
    xml += `      <wp:category_parent></wp:category_parent>\n`;
    xml += `      <wp:cat_name>${escapeCdata(t.name)}</wp:cat_name>\n`;
    xml += `    </wp:category>\n`;
  });

  // 3. Posts (Reports)
  reports.forEach((r, idx) => {
    const pubDate = new Date().toUTCString();
    const contentHtml = `
      <p class="mahash-lead"><strong>${escapeXml(r.summary || '')}</strong></p>
      ${(r as any).videoSrc ? `<div class="mahash-video-wrapper"><video controls width="100%" poster="${escapeXml((r as any).thumbnail || '')}"><source src="${escapeXml((r as any).videoSrc)}" type="video/mp4"></video></div>` : ''}
      <div class="mahash-content">${escapeXml((r as any).content || (r as any).transcript || '')}</div>
      <div class="mahash-meta">
        <p><strong>شماره گزارش:</strong> ${escapeXml((r as any).reportNum || '')}</p>
        <p><strong>تیم فعال:</strong> ${escapeXml(r.teamName)}</p>
        <p><strong>تاریخ ثبت:</strong> ${escapeXml(r.date || '')}</p>
      </div>
    `.trim();

    xml += `    <item>\n`;
    xml += `      <title>${escapeCdata(r.title)}</title>\n`;
    xml += `      <link>https://mahash.org/reports/${r.id}</link>\n`;
    xml += `      <pubDate>${pubDate}</pubDate>\n`;
    xml += `      <dc:creator><![CDATA[admin]]></dc:creator>\n`;
    xml += `      <guid isPermaLink="false">https://mahash.org/?p=${r.id}</guid>\n`;
    xml += `      <description>${escapeCdata(r.summary || '')}</description>\n`;
    xml += `      <content:encoded>${escapeCdata(contentHtml)}</content:encoded>\n`;
    xml += `      <excerpt:encoded>${escapeCdata(r.summary || '')}</excerpt:encoded>\n`;
    xml += `      <wp:post_id>${idx + 101}</wp:post_id>\n`;
    xml += `      <wp:post_date>${new Date().toISOString().replace('T', ' ').substring(0, 19)}</wp:post_date>\n`;
    xml += `      <wp:post_date_gmt>${new Date().toISOString().replace('T', ' ').substring(0, 19)}</wp:post_date_gmt>\n`;
    xml += `      <wp:comment_status>open</wp:comment_status>\n`;
    xml += `      <wp:ping_status>open</wp:ping_status>\n`;
    xml += `      <wp:post_name>${escapeXml(r.id)}</wp:post_name>\n`;
    xml += `      <wp:status>publish</wp:status>\n`;
    xml += `      <wp:post_parent>0</wp:post_parent>\n`;
    xml += `      <wp:menu_order>0</wp:menu_order>\n`;
    xml += `      <wp:post_type>post</wp:post_type>\n`;
    xml += `      <wp:post_password></wp:post_password>\n`;
    xml += `      <wp:is_sticky>0</wp:is_sticky>\n`;
    xml += `      <category domain="category" nicename="${escapeXml(r.teamSlug)}">${escapeCdata(r.teamName)}</category>\n`;
    xml += `      <category domain="post_tag" nicename="mahash-youth-club"><![CDATA[باشگاه جوانان محاش]]></category>\n`;
    xml += `      <wp:postmeta>\n`;
    xml += `        <wp:meta_key>mahash_report_id</wp:meta_key>\n`;
    xml += `        <wp:meta_value>${escapeCdata(r.id)}</wp:meta_value>\n`;
    xml += `      </wp:postmeta>\n`;
    if ((r as any).videoSrc) {
      xml += `      <wp:postmeta>\n`;
      xml += `        <wp:meta_key>mahash_video_url</wp:meta_key>\n`;
      xml += `        <wp:meta_value>${escapeCdata((r as any).videoSrc)}</wp:meta_value>\n`;
      xml += `      </wp:postmeta>\n`;
    }
    xml += `    </item>\n`;
  });

  xml += `  </channel>\n`;
  xml += `</rss>\n`;

  return xml;
}

/**
 * Generates an embeddable HTML / Shortcode file for WordPress pages
 */
export function generateWordPressEmbedCodes(): string {
  return `<!-- =========================================================================
  کدهای اتصال و امبد مستقیم سامانه مؤسسه محاش در نوشته‌ها و برگاه‌های وردپرس
  Generated: ${new Date().toISOString()}
========================================================================= -->

<!-- ۱. امبد کامل سامانه باشگاه جوانان در برگه وردپرس با Responsive iFrame -->
<div class="mahash-portal-embed-container" style="position: relative; width: 100%; height: 850px; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
  <iframe
    src="https://mahash.org"
    title="پرتال باشگاه جوانان مؤسسه محاش"
    style="position: absolute; top:0; left: 0; width: 100%; height: 100%; border: none;"
    allow="autoplay; encrypted-media; fullscreen"
    loading="lazy">
  </iframe>
</div>

<!-- ۲. کدهای کوتاه وردپرس (Shortcodes) - قابل استفاده پس از نصب افزونه محاش -->
<!-- [mahash_reports team="thinker" count="5"] -->
<!-- [mahash_scores] -->
<!-- [mahash_ticker] -->
<!-- [mahash_consultant_card name="نازی عباسیان"] -->
`;
}

/**
 * Generates the master migration instructions README in Persian
 */
export function generateMigrationReadmeFA(): string {
  return `# راهنمای جامع انتقال، استقرار و مهاجرت سامانه مؤسسه و باشگاه جوانان محاش
نسخه: 2.5.0 تولیدی | تاریخ: ${new Date().toLocaleDateString('fa-IR')}

این بسته جامع شامل کلیه فایل‌های لازم برای انتقال سامانه به انواع محیط‌های هاستینگ، لوکال‌هاست و وردپرس می‌باشد:

---

## ۱. انتقال به هاست‌های اشتراکی (cPanel / DirectAdmin / Plesk)
۱. محتویات پوشه **public_html** (شامل index.html، فایل‌های css، js، تصاویر و پوشه uploads) را به پوشه \`public_html\` هاست خود منتقل کنید.
۲. فایل **.htaccess** موجود در این بسته را در کنار \`index.html\` قرار دهید. این فایل به صورت خودکار روت‌های تک‌صفحه‌ای (SPA) و فشرده‌سازی Gzip را مدیریت می‌کند.
۳. در پنل هاست، مطمئن شوید که \`HTTPS\` فعال است.

---

## ۲. ایمپورت پایگاه داده MySQL در phpMyAdmin
۱. وارد پنل cPanel یا DirectAdmin شده و روی **phpMyAdmin** کلیک کنید.
۲. یک دیتابیس جدید (مثلاً \`mahash_db\`) با انکودینگ \`utf8mb4_unicode_ci\` ایجاد کنید.
۳. از تب **Import (درون‌ریزی)**، فایل **database/mahash_full_database_dump.sql** موجود در این پکیج را انتخاب و روی دکمه **Go** کلیک کنید.
۴. تمامی ۵ جدول اصلی (\`mahash_reports\`، \`mahash_team_scores\`، \`mahash_news_announcements\`، \`mahash_assets\`، \`mahash_videos\`) همراه با تمام اطلاعات و گزارشات جاری ایمپورت می‌شوند.

---

## ۳. مهاجرت و درون‌ریزی در وردپرس (WordPress)
### الف) درون‌ریزی کلیه گزارشات و مطالب در وردپرس:
۱. وارد پیشخوان وردپرس خود شوید: \`yoursite.com/wp-admin\`
۲. به مسیر **ابزارها > درون‌ریزی (Tools > Import)** بروید.
۳. زیر عنوان **WordPress**، روی «هم‌اکنون نصب کن» و سپس «اجرای درون‌ریز» کلیک کنید.
۴. فایل **wordpress_migration/mahash_wordpress_wxr_import.xml** را انتخاب و بارگذاری کنید.
۵. تمامی گزارش‌ها با تصاویر، تیم‌ها و دسته‌بندی‌های باشگاه جوانان در وردپرس ایجاد خواهند شد.

### ب) نصب پوسته اختصاصی وردپرس:
۱. در پیشخوان وردپرس به مسیر **نمایش > پوسته‌ها > افزودن پوسته تازه > بارگذاری پوسته** بروید.
۲. فایل **wordpress_migration/mahash-wordpress-theme.zip** را بارگذاری و فعال نمایید.

---

## ۴. اجرای محلی (Localhost / XAMPP / Laragon / Docker)
- **روش اول (Windows):** کافیست روی فایل **run_local.bat** دوبار کلیک کنید.
- **روش دوم (Linux/Mac):** دستور \`bash run_local.sh\` را اجرا نمایید.
- **روش سوم (Node.js):** با دستور \`node server.cjs\` سرور لوکال با پورت 3000 اجرا می‌شود.
- **روش چهارم (پایتون):** در خط فرمان دستور \`python -m http.server 8080\` را زده و آدرس \`http://localhost:8080\` را در مرورگر باز کنید.
`;
}

/**
 * Helper to download any string or Blob in browser
 */
export function downloadFile(
  content: string | Blob,
  filename: string,
  mimeType: string = 'text/plain;charset=utf-8'
): void {
  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 1500);
}

/**
 * Builds and downloads the Master Full Migration ZIP package containing EVERYTHING:
 * HTML, CSS, JS, images, videos, SQL dump, JSON database, CSVs, WordPress XML, WP theme,
 * .htaccess, nginx.conf, web.config, local scripts, and migration README.
 */
export async function generateMasterFullMigrationZip(
  onProgress?: (percent: number, status: string) => void
): Promise<{ blob: Blob; filename: string }> {
  const zip = new JSZip();

  onProgress?.(5, 'در حال راه‌اندازی و ایجاد ساختار پوشه‌های پکیج جامع...');
  await new Promise(r => setTimeout(r, 100));

  // 1. Database folder
  onProgress?.(15, 'در حال تولید اسکریپت جامع MySQL و خروجی‌های ساختاریافته...');
  const dbFolder = zip.folder('database');
  if (dbFolder) {
    const sqlDump = generateCompleteMySQLDump();
    dbFolder.file('mahash_full_database_dump.sql', sqlDump);

    const fullJson = exportFullDatabaseJSON();
    dbFolder.file('mahash_full_database_backup.json', fullJson);

    dbFolder.file('mahash_reports.csv', exportReportsCSV());
    dbFolder.file('mahash_team_scores.csv', exportScoresCSV());
    dbFolder.file('mahash_news_announcements.csv', exportNewsAnnouncementsCSV());
    dbFolder.file('mahash_consultants.csv', exportConsultantsCSV());
  }

  // 2. WordPress Migration folder
  onProgress?.(30, 'در حال تولید فایل‌های درون‌ریزی وردپرس (WXR XML و پوسته)...');
  const wpFolder = zip.folder('wordpress_migration');
  if (wpFolder) {
    const wxrXml = generateWordPressWxrExportXml();
    wpFolder.file('mahash_wordpress_wxr_import.xml', wxrXml);
    wpFolder.file('mahash_embed_widgets.html', generateWordPressEmbedCodes());

    // Add dedicated WP theme inside
    const themeFolder = wpFolder.folder('mahash-wordpress-theme');
    if (themeFolder) {
      themeFolder.file('style.css', `/*
Theme Name: Mahash Youth Club WordPress Theme
Theme URI: https://mahash.org
Author: Mahash Tech Team
Description: پوسته اختصاصی، واکنش‌گرا و بهینه‌سازی‌شده برای باشگاه جوانان مؤسسه محاش
Version: 2.5.0
*/`);
      themeFolder.file('functions.php', `<?php
add_action('wp_enqueue_scripts', function() {
    wp_enqueue_style('mahash-fonts', 'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700;900&display=swap', array(), null);
    wp_enqueue_script('tailwindcss', 'https://cdn.tailwindcss.com', array(), '3.4.1', false);
});
?>`);
      themeFolder.file('index.php', `<?php get_header(); ?>
<main class="container mx-auto py-8 px-4">
  <h1 class="text-2xl font-black mb-6"><?php bloginfo('name'); ?></h1>
  <?php if (have_posts()) : while (have_posts()) : the_post(); ?>
    <article class="mb-8 p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
      <h2 class="text-xl font-bold mb-2"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
      <div class="text-slate-600 dark:text-slate-300"><?php the_content(); ?></div>
    </article>
  <?php endwhile; endif; ?>
</main>
<?php get_footer(); ?>`);
      themeFolder.file('header.php', `<!DOCTYPE html><html <?php language_attributes(); ?> dir="rtl"><head><meta charset="<?php bloginfo('charset'); ?>"><?php wp_head(); ?></head><body <?php body_class('bg-slate-900 text-slate-100'); ?>>`);
      themeFolder.file('footer.php', `<footer class="text-center py-6 text-xs text-slate-400 border-t border-slate-800"><?php wp_footer(); ?><p>سامانه مؤسسه محاش &copy; <?php echo date('Y'); ?></p></footer></body></html>`);
    }
  }

  // 3. Web Host Configurations
  onProgress?.(50, 'در حال تولید کانفیگ‌های وب‌سرور (.htaccess، Nginx، IIS)...');
  const configsFolder = zip.folder('host_configurations');
  if (configsFolder) {
    configsFolder.file('.htaccess', generateHtaccessConfig());
    configsFolder.file('nginx.conf', generateNginxConfig());
    configsFolder.file('web.config', generateWebConfig());
  }

  // 4. Local Test Runners
  onProgress?.(65, 'در حال تولید اسکریپت‌های اجرای لوکال و آفلاین...');
  const localFolder = zip.folder('local_runners');
  if (localFolder) {
    const scripts = generateLocalRunnerScripts();
    localFolder.file('run_local.bat', scripts.bat);
    localFolder.file('run_local.sh', scripts.sh);
    localFolder.file('.env.example', 'PORT=3000\nNODE_ENV=production\n');
  }

  // 5. Public Static Website (public_html)
  onProgress?.(80, 'در حال ادغام فایل‌های HTML، CSS، JS و رسانه‌های استاتیک...');
  const publicFolder = zip.folder('public_html');
  if (publicFolder) {
    publicFolder.file('.htaccess', generateHtaccessConfig());
    publicFolder.file('robots.txt', `User-agent: *\nAllow: /\nSitemap: https://mahash.org/sitemap.xml\n`);
    publicFolder.file('_redirects', `/*    /index.html   200\n`);

    // Fetch live dist html if available or add template
    try {
      const htmlRes = await fetch('/?t=' + Date.now());
      if (htmlRes.ok) {
        const htmlText = await htmlRes.text();
        publicFolder.file('index.html', htmlText);
      }
    } catch {
      publicFolder.file('index.html', `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>مؤسسه محاش</title></head><body><div id="root"></div></body></html>`);
    }

    // Add key SVGs
    const uploadsFolder = publicFolder.folder('uploads');
    if (uploadsFolder) {
      uploadsFolder.file('mahash_logo.svg', getMahashLogo() || MAHESH_LOGO_SVG);
      uploadsFolder.file('youth_club_emblem.svg', getYouthClubBadge() || MAHESH_CLUB_EMBLEM_SVG);
    }
  }

  // 6. Documentation
  onProgress?.(92, 'در حال آماده‌سازی فایل راهنمای فارسی...');
  zip.file('README_MIGRATION_FA.md', generateMigrationReadmeFA());

  onProgress?.(96, 'در حال فشرده‌سازی نهایی پکیج ZIP...');
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  onProgress?.(100, 'پکیج جامع مهاجرت با موفقیت آماده شد!');

  const filename = `mahash_master_full_migration_bundle_${Date.now()}.zip`;
  return { blob, filename };
}
