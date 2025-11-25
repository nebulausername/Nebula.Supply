import { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { Loader2, ZoomIn } from 'lucide-react';

interface EnhancedProductImageProps {
  src?: string;
  alt: string;
  aspectRatio?: string;
  priority?: boolean;
  fallbackColor?: string;
  overlayLabel?: string;
  className?: string;
  enableZoom?: boolean;
  enableParallax?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * 🎨 Enhanced Product Image Component
 * Features: Progressive loading, zoom, parallax, blur-up effect
 */
export const EnhancedProductImage = ({
  src,
  alt,
  aspectRatio = '4 / 3',
  priority = false,
  fallbackColor = '#0BF7BC',
  overlayLabel,
  className,
  enableZoom = true,
  enableParallax = false,
  onLoad,
  onError
}: EnhancedProductImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(!src);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 🎯 Handle Image Load
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  // 🎯 Handle Image Error
  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
    onError?.();
  };

  // 🎯 Handle Zoom Toggle
  const handleZoomToggle = () => {
    if (enableZoom && isLoaded && !hasError) {
      setIsZoomed(!isZoomed);
    }
  };

  // 🎯 Handle Mouse Move for Zoom
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setMousePosition({ x, y });
  };

  // 🎯 Parallax Effect
  useEffect(() => {
    if (!enableParallax || !containerRef.current) return;

    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const scrollPercent = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      const parallaxOffset = (scrollPercent - 0.5) * 20; // Max 20px offset
      
      if (imgRef.current) {
        imgRef.current.style.transform = `translateY(${parallaxOffset}px) scale(${isZoomed ? 2 : 1})`;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [enableParallax, isZoomed]);

  // 🎯 Create SVG Placeholder
  const createPlaceholder = () => {
    const sanitizedLabel = (overlayLabel ?? alt).length > 14 
      ? `${(overlayLabel ?? alt).slice(0, 12)}…` 
      : (overlayLabel ?? alt);
    
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${fallbackColor}" stop-opacity="0.85"/>
            <stop offset="50%" stop-color="#0B0F18" stop-opacity="0.9"/>
            <stop offset="100%" stop-color="#020409" stop-opacity="0.95"/>
          </linearGradient>
        </defs>
        <rect width="800" height="600" fill="url(#g)"/>
        <text x="50%" y="52%" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-size="72" fill="#D1FAE5" letter-spacing="18">
          ${sanitizedLabel.toUpperCase()}
        </text>
      </svg>`;
    
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full overflow-hidden rounded-xl border border-white/10 bg-[#05070b] group',
        enableZoom && isLoaded && !hasError && 'cursor-zoom-in',
        isZoomed && 'cursor-zoom-out',
        className
      )}
      style={{ aspectRatio }}
      onClick={handleZoomToggle}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setIsZoomed(false)}
    >
      {/* Loading State */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/5">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      )}

      {/* Blur Placeholder */}
      {!isLoaded && !hasError && src && (
        <div
          className="absolute inset-0 animate-pulse blur-sm scale-110 transition-opacity duration-300"
          style={{
            backgroundColor: fallbackColor,
            backgroundImage: `linear-gradient(45deg, ${fallbackColor} 25%, transparent 25%), 
                            linear-gradient(-45deg, ${fallbackColor} 25%, transparent 25%), 
                            linear-gradient(45deg, transparent 75%, ${fallbackColor} 75%), 
                            linear-gradient(-45deg, transparent 75%, ${fallbackColor} 75%)`,
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
          }}
        />
      )}

      {/* Actual Image */}
      {!hasError && src ? (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className={cn(
            'h-full w-full object-cover transition-all duration-500',
            isLoaded ? 'opacity-100' : 'opacity-0',
            !isZoomed && 'group-hover:scale-105',
            isZoomed && 'scale-200'
          )}
          style={isZoomed ? {
            transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`
          } : undefined}
          onLoad={handleLoad}
          onError={handleError}
        />
      ) : (
        <img
          src={createPlaceholder()}
          alt={alt}
          className="h-full w-full object-cover"
        />
      )}

      {/* Overlay Gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(11,247,188,0.08),transparent_70%)]" />

      {/* Hover Overlay with Actions */}
      {enableZoom && isLoaded && !hasError && !isZoomed && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center gap-2 text-white">
            <ZoomIn className="h-6 w-6" />
            <span className="text-sm font-medium">Zum Zoomen klicken</span>
          </div>
        </div>
      )}

      {/* Overlay Label */}
      {overlayLabel && (
        <div className="absolute bottom-3 left-3 rounded-full bg-black/60 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white">
          {overlayLabel}
        </div>
      )}

      {/* Zoom Indicator */}
      {isZoomed && (
        <div className="absolute top-3 right-3 rounded-full bg-black/60 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white">
          2x Zoom
        </div>
      )}
    </div>
  );
};





