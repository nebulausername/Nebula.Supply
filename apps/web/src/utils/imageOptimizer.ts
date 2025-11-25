export interface ImageOptimizerOptions {
  src: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'png';
  loading?: 'lazy' | 'eager';
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

export const generateImageSrcSet = (
  src: string,
  widths: number[] = [400, 800, 1200, 1600],
  format: 'webp' | 'jpg' = 'webp'
): string => {
  return widths
    .map((width) => `${src}?w=${width}&format=${format} ${width}w`)
    .join(', ');
};

export const generateImageSizes = (breakpoints: Record<string, string> = {}): string => {
  const defaultSizes = {
    sm: '100vw',
    md: '50vw',
    lg: '33vw',
    xl: '25vw'
  };

  const sizes = { ...defaultSizes, ...breakpoints };

  return Object.entries(sizes)
    .map(([breakpoint, size]) => {
      const tailwindBreakpoint = {
        sm: '(min-width: 640px)',
        md: '(min-width: 768px)',
        lg: '(min-width: 1024px)',
        xl: '(min-width: 1280px)'
      }[breakpoint] || '';

      return tailwindBreakpoint ? `${tailwindBreakpoint} ${size}` : size;
    })
    .join(', ');
};

export const optimizeImageUrl = (
  src: string,
  options: Partial<ImageOptimizerOptions> = {}
): string => {
  const { width, height, quality = 80, format = 'webp' } = options;
  const url = new URL(src, window.location.origin);
  
  if (width) url.searchParams.set('w', width.toString());
  if (height) url.searchParams.set('h', height.toString());
  url.searchParams.set('q', quality.toString());
  url.searchParams.set('format', format);

  return url.toString();
};

export const getImagePlaceholder = (width: number = 400, height: number = 300): string => {
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#1a1a1a"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#666" font-family="system-ui" font-size="14">Loading...</text>
    </svg>
  `)}`;
};

