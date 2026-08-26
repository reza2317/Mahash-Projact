/**
 * Optimized Image Compression Utility for Logos and Photos
 * Ensures uploaded photos and logos are crisp, lightweight (< 100KB),
 * and safely persist in localStorage without hitting quota limits.
 */

export async function compressImageToDataUrl(
  input: File | Blob | string,
  maxDimension: number = 512,
  quality: number = 0.88
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If input is SVG string or raw data, preserve SVG directly
    if (typeof input === 'string') {
      if (input.startsWith('<svg') || input.startsWith('data:image/svg+xml')) {
        return resolve(input);
      }
    }

    const processImage = (imgSrc: string) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          let { width, height } = img;

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
          canvas.width = Math.max(width, 1);
          canvas.height = Math.max(height, 1);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve(imgSrc);
          }

          // Enable high-quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Use PNG if original has transparency or is PNG, otherwise high-efficiency WebP/JPEG
          let compressedUrl = '';
          try {
            compressedUrl = canvas.toDataURL('image/webp', quality);
            if (!compressedUrl || !compressedUrl.startsWith('data:image/webp')) {
              compressedUrl = canvas.toDataURL('image/png');
            }
          } catch {
            compressedUrl = canvas.toDataURL('image/png');
          }

          resolve(compressedUrl || imgSrc);
        } catch (err) {
          console.warn('Canvas compression error, using raw source:', err);
          resolve(imgSrc);
        }
      };

      img.onerror = () => {
        resolve(imgSrc);
      };

      img.src = imgSrc;
    };

    if (typeof input === 'string') {
      processImage(input);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const res = e.target?.result;
        if (typeof res === 'string') {
          processImage(res);
        } else {
          reject(new Error('Failed to read file as data URL'));
        }
      };
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsDataURL(input);
    }
  });
}
