import JSZip from 'jszip';

/**
 * Utility for reliable downloading of the Netlify deployment package in all browser/iframe contexts.
 */
export async function downloadNetlifyDeploymentZip(
  onStatus?: (message: string) => void
): Promise<{ success: boolean; message?: string }> {
  try {
    if (onStatus) onStatus('در حال اتصال به سرور و آماده‌سازی پکیج استقرار Netlify...');

    // 1. Fetch the static/dynamic zip from server
    const candidates = [
      '/api/export-netlify-zip?t=' + Date.now(),
      '/mahash-dist-netlify.zip?t=' + Date.now(),
      '/api/export-dist-zip?t=' + Date.now(),
      '/dist.zip'
    ];

    let blob: Blob | null = null;

    for (const url of candidates) {
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/zip, application/octet-stream, */*'
          }
        });
        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          // Ensure it's not returning an HTML 404/SPA error page
          if (!contentType.includes('text/html')) {
            const candidateBlob = await res.blob();
            if (candidateBlob.size > 1000) {
              blob = candidateBlob;
              break;
            }
          }
        }
      } catch {
        // continue to next candidate
      }
    }

    // 2. Client-side fallback generation using JSZip if server endpoint was unreachable
    if (!blob || blob.size < 1000) {
      if (onStatus) onStatus('در حال ساخت پکیج استقرار مستقیم در مرورگر (Client-Side Packaging)...');
      const zip = new JSZip();

      // Ensure Netlify SPA redirects
      zip.file('_redirects', '/*    /index.html   200\n');

      // Security and cache headers
      const headersContent = `/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
/assets/*
  Cache-Control: public, max-age=31536000, immutable
`;
      zip.file('_headers', headersContent);

      // Deployment instructions
      const readme = `# راهنمای استقرار پایگاه داده و وب‌سایت محاش در Netlify
تاریخ بسته‌بندی: ${new Date().toLocaleDateString('fa-IR')}

۱. این فایل ZIP را به صورت مستقیم در پنل Netlify بخش Deploys بکشید و رها کنید (Drag & Drop).
۲. فایل‌های _redirects و _headers به طور خودکار سیستم SPA و کش بهینه را فعال می‌کنند.
`;
      zip.file('DEPLOYMENT_INSTRUCTIONS_FA.md', readme);

      // Database backup JSON
      const localDataStore = localStorage.getItem('mahash_persistent_store') || '{}';
      zip.file('database/mahash_database_backup.json', localDataStore);

      // Include current HTML document as index.html
      const currentHtml = document.documentElement.outerHTML;
      zip.file('index.html', '<!doctype html>\n' + currentHtml);

      blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    }

    if (!blob || blob.size < 500) {
      throw new Error('امکان ایجاد پکیج استقرار معتبر فراهم نشد.');
    }

    if (onStatus) onStatus('فایل آماده شد، در حال آغاز دانلود...');

    // 3. Trigger browser download via temporary object URL
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = 'mahash-dist-netlify.zip';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      try {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(objectUrl);
      } catch {}
    }, 3000);

    return {
      success: true,
      message: `فایل mahash-dist-netlify.zip با حجم ${(blob.size / 1024 / 1024).toFixed(2)} مگابایت با موفقیت دانلود شد.`
    };
  } catch (err: any) {
    console.error('[downloadNetlifyDeploymentZip] Error:', err);
    return {
      success: false,
      message: err?.message || 'خطا در دانلود فایل زیپ استقرار'
    };
  }
}
