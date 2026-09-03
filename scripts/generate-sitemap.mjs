import fs from 'fs';
import path from 'path';

const SITE_URL = process.env.SITE_URL || 'https://mahash.org';
const CURRENT_DATE = new Date().toISOString().split('T')[0];

const staticRoutes = [
  { url: '', priority: '1.0', changefreq: 'daily' },
  { url: '#/home', priority: '1.0', changefreq: 'daily' },
  { url: '#/teams-hub', priority: '0.9', changefreq: 'weekly' },
  { url: 'teams-hub', priority: '0.9', changefreq: 'weekly' },
  { url: '#/scores', priority: '0.9', changefreq: 'daily' },
  { url: 'scores', priority: '0.9', changefreq: 'daily' },
  { url: '#/team-tomorrow', priority: '0.85', changefreq: 'weekly' },
  { url: 'team-tomorrow', priority: '0.85', changefreq: 'weekly' },
  { url: '#/team-thinker', priority: '0.85', changefreq: 'weekly' },
  { url: 'team-thinker', priority: '0.85', changefreq: 'weekly' },
  { url: '#/team-angels', priority: '0.85', changefreq: 'weekly' },
  { url: 'team-angels', priority: '0.85', changefreq: 'weekly' },
  { url: '#/team-ghorbani', priority: '0.85', changefreq: 'weekly' },
  { url: 'team-ghorbani', priority: '0.85', changefreq: 'weekly' },
  { url: '#/team-silence', priority: '0.85', changefreq: 'weekly' },
  { url: 'team-silence', priority: '0.85', changefreq: 'weekly' },
  { url: '#/membership', priority: '0.8', changefreq: 'monthly' },
  { url: 'membership', priority: '0.8', changefreq: 'monthly' },
  { url: '#/consultation', priority: '0.8', changefreq: 'monthly' },
  { url: 'consultation', priority: '0.8', changefreq: 'monthly' },
  { url: '#/education', priority: '0.8', changefreq: 'monthly' },
  { url: 'education', priority: '0.8', changefreq: 'monthly' },
  { url: '#/events', priority: '0.8', changefreq: 'weekly' },
  { url: 'events', priority: '0.8', changefreq: 'weekly' },
  { url: '#/contact', priority: '0.7', changefreq: 'monthly' },
  { url: 'contact', priority: '0.7', changefreq: 'monthly' },
  { url: '#/rehab', priority: '0.8', changefreq: 'monthly' },
  { url: 'rehab', priority: '0.8', changefreq: 'monthly' },
  { url: '#/employment', priority: '0.8', changefreq: 'monthly' },
  { url: 'employment', priority: '0.8', changefreq: 'monthly' },
  { url: '#/marriage', priority: '0.8', changefreq: 'monthly' },
  { url: 'marriage', priority: '0.8', changefreq: 'monthly' },
  { url: '#/social-work', priority: '0.8', changefreq: 'monthly' },
  { url: 'social-work', priority: '0.8', changefreq: 'monthly' },
  { url: '#/about', priority: '0.7', changefreq: 'monthly' },
  { url: 'about', priority: '0.7', changefreq: 'monthly' },
  { url: '#/history', priority: '0.7', changefreq: 'monthly' },
  { url: 'history', priority: '0.7', changefreq: 'monthly' },
  { url: '#/mission', priority: '0.7', changefreq: 'monthly' },
  { url: 'mission', priority: '0.7', changefreq: 'monthly' },
  { url: '#/goals', priority: '0.7', changefreq: 'monthly' },
  { url: 'goals', priority: '0.7', changefreq: 'monthly' },
  { url: '#/statute', priority: '0.7', changefreq: 'monthly' },
  { url: 'statute', priority: '0.7', changefreq: 'monthly' }
];

export function generateSitemap() {
  const dynamicRoutes = [];

  // Attempt to parse data_store.json if available
  const dataStorePath = path.join(process.cwd(), 'data_store.json');
  if (fs.existsSync(dataStorePath)) {
    try {
      const content = fs.readFileSync(dataStorePath, 'utf8');
      if (content.trim()) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed.customReports)) {
          for (const report of parsed.customReports) {
            if (report && (report.id || report.teamSlug)) {
              dynamicRoutes.push({
                url: `#/team-${report.teamSlug || 'tomorrow'}?report=${report.id}`,
                priority: '0.75',
                changefreq: 'weekly',
                lastmod: report.date ? new Date().toISOString().split('T')[0] : CURRENT_DATE
              });
            }
          }
        }
      }
    } catch (e) {
      // Graceful fallback
    }
  }

  const allRoutes = [...staticRoutes, ...dynamicRoutes];

  const xmlEntries = allRoutes
    .map((route) => {
      const cleanUrl = route.url ? `${SITE_URL}/${route.url}` : SITE_URL;
      const lastmod = route.lastmod || CURRENT_DATE;
      return `  <url>
    <loc>${escapeXml(cleanUrl)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${xmlEntries}
</urlset>`;

  // Write to public/sitemap.xml
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const publicSitemap = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(publicSitemap, xml, 'utf8');
  console.log(`[Sitemap] Generated ${publicSitemap} with ${allRoutes.length} URLs`);

  // Write to dist/sitemap.xml if dist directory exists
  const distDir = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    const distSitemap = path.join(distDir, 'sitemap.xml');
    fs.writeFileSync(distSitemap, xml, 'utf8');
    console.log(`[Sitemap] Copied to ${distSitemap}`);
  }

  // Generate robots.txt if missing
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /api/admin/
Disallow: /#/admin

Sitemap: ${SITE_URL}/sitemap.xml
`;

  const publicRobots = path.join(publicDir, 'robots.txt');
  fs.writeFileSync(publicRobots, robotsTxt, 'utf8');

  if (fs.existsSync(distDir)) {
    const distRobots = path.join(distDir, 'robots.txt');
    fs.writeFileSync(distRobots, robotsTxt, 'utf8');
  }

  return xml;
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

// Run if called directly
generateSitemap();
