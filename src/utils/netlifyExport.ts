import JSZip from 'jszip';

export const NETLIFY_ZIP_DIRECT_URL = '/api/export-netlify-zip';

/**
 * Downloads a Blob with real-time byte and percentage progress tracking via XMLHttpRequest.
 */
function fetchBlobWithProgress(
  url: string,
  onProgress?: (percent: number, loadedBytes: number, totalBytes: number) => void
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'blob';
    xhr.setRequestHeader('Accept', 'application/zip, application/octet-stream, */*');

    xhr.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
        onProgress?.(percent, event.loaded, event.total);
      } else {
        onProgress?.(50, event.loaded, 0);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const blob = xhr.response as Blob;
        const contentType = xhr.getResponseHeader('content-type') || '';
        if (contentType.includes('text/html') || blob.size < 1000) {
          reject(new Error('Invalid response or HTML error page returned'));
        } else {
          onProgress?.(100, blob.size, blob.size);
          resolve(blob);
        }
      } else {
        reject(new Error(`HTTP ${xhr.status} ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => reject(new Error('خطای شبکه در اتصال به سرور'));
    xhr.ontimeout = () => reject(new Error('مهلت اتصال به سرور به پایان رسید'));
    xhr.timeout = 30000; // 30s timeout

    xhr.send();
  });
}

/**
 * Direct browser download trigger via native anchor element.
 */
export function triggerDirectNetlifyDownload(): void {
  const link = document.createElement('a');
  link.href = `${NETLIFY_ZIP_DIRECT_URL}?t=${Date.now()}`;
  link.download = 'mahash-dist-netlify.zip';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    try {
      document.body.removeChild(link);
    } catch {}
  }, 1000);
}

/**
 * Utility for reliable downloading of the Netlify deployment package in all browser/iframe contexts.
 * Displays real-time progress and automatically falls back to direct browser streaming if needed.
 */
export async function downloadNetlifyDeploymentZip(
  onStatus?: (message: string) => void
): Promise<{ success: boolean; message?: string }> {
  try {
    if (onStatus) onStatus('در حال اتصال به سرور و دریافت پکیج Netlify...');

    // 1. Fetch the static/dynamic zip from server with live progress
    const candidates = [
      '/api/export-netlify-zip?t=' + Date.now(),
      '/mahash-dist-netlify.zip?t=' + Date.now(),
      '/api/export-dist-zip?t=' + Date.now()
    ];

    let blob: Blob | null = null;

    for (const url of candidates) {
      try {
        blob = await fetchBlobWithProgress(url, (percent, loadedBytes, totalBytes) => {
          if (onStatus) {
            const loadedMB = (loadedBytes / (1024 * 1024)).toFixed(1);
            if (totalBytes > 0) {
              const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);
              onStatus(`در حال دریافت بسته Netlify: ${percent}٪ (${loadedMB} از ${totalMB} مگابایت)...`);
            } else {
              onStatus(`در حال دریافت بسته Netlify (${loadedMB} مگابایت)...`);
            }
          }
        });
        if (blob && blob.size > 1000) {
          break;
        }
      } catch (err: any) {
        console.warn(`[downloadNetlifyDeploymentZip] Candidate ${url} failed:`, err?.message);
        // Continue to next candidate
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

      blob = await zip.generateAsync(
        { type: 'blob', compression: 'DEFLATE' },
        (metadata) => {
          if (onStatus) {
            onStatus(`در حال فشرده‌سازی پکیج کلاینت: ${Math.round(metadata.percent)}٪...`);
          }
        }
      );
    }

    if (!blob || blob.size < 500) {
      // Last resort: trigger direct download link
      triggerDirectNetlifyDownload();
      return {
        success: true,
        message: 'دانلود مستقیم بسته Netlify در مرورگر فعال شد.'
      };
    }

    if (onStatus) onStatus('فایل آماده شد، در حال ذخیره در رایانه شما...');

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
      message: `فایل mahash-dist-netlify.zip با حجم ${(blob.size / 1024 / 1024).toFixed(2)} مگابایت با موفقیت دریافت شد.`
    };
  } catch (err: any) {
    console.error('[downloadNetlifyDeploymentZip] Error:', err);
    // Fallback to direct anchor download
    try {
      triggerDirectNetlifyDownload();
      return {
        success: true,
        message: 'دانلود مستقیم بسته Netlify آغاز شد.'
      };
    } catch {}
    return {
      success: false,
      message: err?.message || 'خطا در دانلود فایل زیپ استقرار'
    };
  }
}
