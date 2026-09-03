/**
 * Image Optimization Utilities
 * Handles client-side WebP conversion, compression, aspect ratio calculations,
 * and byte formatting for optimal media delivery and MySQL persistence.
 */

export interface WebPOptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0 (default 0.85)
  format?: 'image/webp' | 'image/jpeg' | 'image/png';
}

export interface WebPOptimizeResult {
  dataUrl: string;
  blob?: Blob;
  mimeType: string;
  width: number;
  height: number;
  sizeBytes: number;
  originalSizeBytes: number;
  compressionRatioPercent: number;
  formatSaved: string;
}

/**
 * Checks if the current client browser supports native WebP export from canvas
 */
export function isWebPSupported(): boolean {
  try {
    const elem = document.createElement('canvas');
    if (elem.getContext && elem.getContext('2d')) {
      return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Formats raw bytes into human readable KB / MB
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (!bytes || bytes <= 0) return '۰ بایت';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['بایت', 'کیلوبایت (KB)', 'مگابایت (MB)', 'گیگابایت (GB)'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
  return `${val} ${sizes[i]}`;
}

/**
 * Loads an image from File, Blob, or Data URL into an HTMLImageElement
 */
function loadImage(source: File | Blob | string): Promise<{ img: HTMLImageElement; originalSize: number }> {
  return new Promise((resolve, reject) => {
    let originalSize = 0;
    let objectUrlToRevoke: string | null = null;
    const img = new Image();
    img.crossOrigin = 'anonymous';

    if (typeof source === 'string') {
      originalSize = Math.round((source.length * 3) / 4);
      img.src = source;
    } else {
      originalSize = source.size;
      objectUrlToRevoke = URL.createObjectURL(source);
      img.src = objectUrlToRevoke;
    }

    img.onload = () => {
      if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
      resolve({ img, originalSize });
    };

    img.onerror = (err) => {
      if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
      reject(new Error('خطا در خواندن فایل یا فرمت نامعتبر تصویر'));
    };
  });
}

/**
 * Converts any image (PNG, JPG, SVG, WebP) to an optimized, compressed WebP data URL
 */
export async function convertToWebP(
  source: File | Blob | string,
  options: WebPOptimizeOptions = {}
): Promise<WebPOptimizeResult> {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.85,
    format = 'image/webp'
  } = options;

  const { img, originalSize } = await loadImage(source);

  // Calculate new constrained dimensions keeping aspect ratio
  let { width, height } = img;
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  // Create canvas and draw image
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context is not available');
  }

  // High quality smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw image
  ctx.drawImage(img, 0, 0, width, height);

  // Choose target format (fall back to image/jpeg if webp not supported)
  const targetMime = isWebPSupported() ? format : 'image/jpeg';
  const dataUrl = canvas.toDataURL(targetMime, quality);

  // Calculate new size
  // Base64 length * 3/4 approximates raw binary bytes
  const base64Data = dataUrl.split(',')[1] || '';
  const newSizeBytes = Math.round((base64Data.length * 3) / 4);

  const compressionRatio = originalSize > 0
    ? Math.max(0, Math.round(((originalSize - newSizeBytes) / originalSize) * 100))
    : 0;

  return {
    dataUrl,
    mimeType: targetMime,
    width,
    height,
    sizeBytes: newSizeBytes,
    originalSizeBytes: originalSize,
    compressionRatioPercent: compressionRatio,
    formatSaved: targetMime === 'image/webp' ? 'WebP' : 'JPEG'
  };
}

/**
 * Helper to determine if a string is a WebP image
 */
export function isWebPFormat(src: string): boolean {
  if (!src) return false;
  return src.startsWith('data:image/webp') || src.toLowerCase().endsWith('.webp');
}
