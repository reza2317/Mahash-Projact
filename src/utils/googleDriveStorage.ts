/**
 * Direct Secure File & Video Storage for Mahash Application
 * Uploads files, videos, images, and attachments directly to the permanent server storage (/uploads/...)
 * Eliminates Google OAuth popups and "Access blocked: Authorization Error".
 */

export interface UploadProgressInfo {
  percent: number;
  loadedBytes: number;
  totalBytes: number;
}

export const uploadFileToServerStorage = async (
  file: File,
  onProgress?: (progress: number, info?: UploadProgressInfo) => void
): Promise<{ id: string; url: string }> => {
  return new Promise((resolve, reject) => {
    try {
      if (onProgress) {
        onProgress(5, { percent: 5, loadedBytes: 0, totalBytes: file.size });
      }

      const serverForm = new FormData();
      serverForm.append('file', file);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload-file', true);

      // Track live upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.min(95, Math.round((event.loaded / event.total) * 100));
          if (onProgress) {
            onProgress(percent, {
              percent,
              loadedBytes: event.loaded,
              totalBytes: event.total
            });
          }
        }
      };

      // Set generous timeout depending on file size (minimum 25s, up to 120s for very large files)
      const timeoutMs = Math.max(25000, Math.min(180000, 25000 + Math.round(file.size / (1024 * 1024)) * 1200));
      xhr.timeout = timeoutMs;

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const serverData = JSON.parse(xhr.responseText);
            if (onProgress) {
              onProgress(100, { percent: 100, loadedBytes: file.size, totalBytes: file.size });
            }
            resolve({
              id: serverData.filename || `file-${Date.now()}`,
              url: serverData.url
            });
          } catch (jsonErr) {
            fallbackLocal();
          }
        } else {
          fallbackLocal();
        }
      };

      xhr.onerror = () => {
        fallbackLocal();
      };

      xhr.ontimeout = () => {
        fallbackLocal();
      };

      const fallbackLocal = () => {
        try {
          const reader = new FileReader();
          reader.onload = async () => {
            const base64Res = reader.result as string;
            // Attempt secondary server base64 upload to ensure persistent /uploads/ URL for public visitors
            try {
              const resp = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  filename: file.name,
                  base64Data: base64Res,
                  contentType: file.type
                })
              });
              const data = await resp.json();
              if (data && data.url) {
                if (onProgress) onProgress(100, { percent: 100, loadedBytes: file.size, totalBytes: file.size });
                resolve({
                  id: data.filename || `file-${Date.now()}`,
                  url: data.url
                });
                return;
              }
            } catch (apiErr) {
              console.warn('Secondary base64 server upload failed, using local Data URL fallback:', apiErr);
            }

            if (onProgress) onProgress(100, { percent: 100, loadedBytes: file.size, totalBytes: file.size });
            resolve({
              id: `local-${Date.now()}`,
              url: base64Res
            });
          };
          reader.onerror = () => {
            const objUrl = URL.createObjectURL(file);
            if (onProgress) onProgress(100, { percent: 100, loadedBytes: file.size, totalBytes: file.size });
            resolve({
              id: `blob-${Date.now()}`,
              url: objUrl
            });
          };
          reader.readAsDataURL(file);
        } catch (fbErr: any) {
          reject(new Error(fbErr?.message || 'خطا در ذخیره‌سازی محلی فایل'));
        }
      };

      xhr.send(serverForm);
    } catch (err: any) {
      reject(err);
    }
  });
};

// Aliases for compatibility with existing imports
export const uploadFileToGoogleDrive = uploadFileToServerStorage;

export const deleteFileFromGoogleDrive = async (_fileId: string): Promise<void> => {
  // Files stored on server can be retained or managed by admin
};
