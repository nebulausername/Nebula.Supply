/**
 * Image Optimization Utilities
 * Supports WebP, AVIF with fallbacks
 */

export interface ImageOptimizationOptions {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
  lazy?: boolean;
  className?: string;
}

const supportsWebP = (): boolean => {
  if (typeof window === 'undefined') return false;
  const canvas = document.createElement('canvas');
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
};

const supportsAVIF = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  
  const avifData = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = avifData;
  });
};

export const getOptimizedImageSrc = async (
  src: string,
  format: 'webp' | 'avif' | 'auto' = 'auto'
): Promise<string> => {
  // If format is auto, detect best supported format
  if (format === 'auto') {
    const avifSupported = await supportsAVIF();
    if (avifSupported) {
      return src.replace(/\.(jpg|jpeg|png)$/i, '.avif');
    }
    if (supportsWebP()) {
      return src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }
    return src;
  }

  // Use specified format
  if (format === 'avif') {
    return src.replace(/\.(jpg|jpeg|png)$/i, '.avif');
  }
  if (format === 'webp') {
    return src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  }

  return src;
};

export const generateSrcSet = (
  baseSrc: string,
  sizes: number[] = [400, 800, 1200, 1600]
): string => {
  return sizes
    .map((size) => `${baseSrc}?w=${size} ${size}w`)
    .join(', ');
};

export const generateResponsiveImage = async (
  options: ImageOptimizationOptions
): Promise<{
  src: string;
  srcSet?: string;
  sizes?: string;
  loading: 'lazy' | 'eager';
}> => {
  const { src, width, height, format = 'auto', lazy = true } = options;

  const optimizedSrc = await getOptimizedImageSrc(src, format);
  const srcSet = width ? generateSrcSet(optimizedSrc, [width, width * 2]) : undefined;

  return {
    src: optimizedSrc,
    srcSet,
    sizes: width ? `(max-width: ${width}px) 100vw, ${width}px` : undefined,
    loading: lazy ? 'lazy' : 'eager'
  };
};

