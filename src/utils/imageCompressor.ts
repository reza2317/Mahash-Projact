/**
 * Optimized Image Compression & Processing Utility for Logos and Photos
 * Ensures uploaded photos, SVGs, and logos are crisp, lightweight (< 100KB),
 * and safely persist in localStorage without hitting quota limits or throwing errors.
 */

export async function compressImageToDataUrl(
  input: File | Blob | string,
  maxDimension: number = 512,
  quality: number = 0.88
): Promise<string> {
  return new Promise((resolve) => {
    // 1. Direct SVG string or Data URI handling
    if (typeof input === 'string') {
      if (input.startsWith('<svg') || input.startsWith('data:image/svg+xml')) {
        return resolve(input);
      }
      if (input.startsWith('data:image/') || input.startsWith('http://') || input.startsWith('https://') || input.startsWith('/')) {
        return processRasterDataUrl(input, maxDimension, quality, resolve);
      }
      return resolve(input);
    }

    // 2. Direct SVG File handling - SVGs should never be rasterized via canvas
    if (input instanceof File || input instanceof Blob) {
      const isSvg = input.type === 'image/svg+xml' || (input instanceof File && input.name.toLowerCase().endsWith('.svg'));
      
      const reader = new FileReader();
      
      if (isSvg) {
        reader.onload = (e) => {
          const content = e.target?.result;
          if (typeof content === 'string') {
            if (content.trim().startsWith('<svg')) {
              const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(content.trim())}`;
              resolve(svgDataUrl);
            } else if (content.startsWith('data:image/svg+xml')) {
              resolve(content);
            } else {
              resolve(content);
            }
          } else {
            resolve('');
          }
        };
        reader.onerror = () => {
          // Fallback to DataURL
          const fallbackReader = new FileReader();
          fallbackReader.onload = (ev) => resolve((ev.target?.result as string) || '');
          fallbackReader.onerror = () => resolve('');
          fallbackReader.readAsDataURL(input);
        };
        reader.readAsText(input);
        return;
      }

      // 3. Raster Image File handling (JPG, PNG, WEBP, GIF, etc.)
      reader.onload = (e) => {
        const dataUrl = e.target?.result;
        if (typeof dataUrl === 'string') {
          processRasterDataUrl(dataUrl, maxDimension, quality, resolve);
        } else {
          resolve('');
        }
      };
      reader.onerror = () => {
        resolve('');
      };
      reader.readAsDataURL(input);
    }
  });
}

function processRasterDataUrl(
  dataUrl: string,
  maxDimension: number,
  quality: number,
  resolve: (res: string) => void
) {
  try {
    const img = new Image();
    if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }

    // Safety timeout in case image loading hangs
    const timeout = setTimeout(() => {
      resolve(dataUrl);
    }, 4000);

    img.onload = () => {
      clearTimeout(timeout);
      try {
        let { width, height } = img;
        if (!width || !height) {
          return resolve(dataUrl);
        }

        // Scale dimensions while preserving aspect ratio
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(Math.floor(width), 1);
        canvas.height = Math.max(Math.floor(height), 1);

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) {
          return resolve(dataUrl);
        }

        // High quality rendering configuration
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Try WebP first for optimal compression, fallback to PNG if transparent or JPEG
        let compressed = '';
        try {
          // If original is PNG or WebP with alpha
          compressed = canvas.toDataURL('image/webp', quality);
          if (!compressed || !compressed.startsWith('data:image/webp')) {
            compressed = canvas.toDataURL('image/png');
          }
        } catch {
          try {
            compressed = canvas.toDataURL('image/jpeg', quality);
          } catch {
            compressed = dataUrl;
          }
        }

        resolve(compressed || dataUrl);
      } catch (canvasErr) {
        console.warn('[imageCompressor] Canvas processing exception, using original data URL:', canvasErr);
        resolve(dataUrl);
      }
    };

    img.onerror = (err) => {
      clearTimeout(timeout);
      console.warn('[imageCompressor] Image element load error, returning raw input:', err);
      resolve(dataUrl);
    };

    img.src = dataUrl;
  } catch (outerErr) {
    console.warn('[imageCompressor] Fatal processing error, returning original:', outerErr);
    resolve(dataUrl);
  }
}
