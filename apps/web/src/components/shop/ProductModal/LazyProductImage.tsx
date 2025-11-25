import { memo, useState, useRef, useEffect } from "react";
import { ProductImage } from "../../media/ProductImage";
import type { ProductMedia } from "@nebula/shared";

interface LazyProductImageProps {
  media: ProductMedia;
  fallbackColor: string;
  overlayLabel: string;
  aspectRatio?: string;
  priority?: boolean;
  className?: string;
  onClick?: () => void;
}

// 🎯 Optimierte Lazy Loading Image-Komponente
export const LazyProductImage = memo(({ 
  media, 
  fallbackColor, 
  overlayLabel, 
  aspectRatio = "4 / 3",
  priority = false,
  className,
  onClick
}: LazyProductImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // 🎯 Intersection Observer für Lazy Loading
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px' // Start loading 50px before element comes into view
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  // 🎯 Error Handling
  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
  };

  // 🎯 Load Handler
  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  return (
    <div 
      ref={imgRef}
      className={`relative transition-all duration-300 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      } ${className || ''}`}
      onClick={onClick}
    >
      {isInView && (
        <ProductImage
          src={media.url}
          alt={media.alt}
          fallbackColor={fallbackColor}
          overlayLabel={overlayLabel}
          aspectRatio={aspectRatio}
          priority={priority}
          className="w-full h-full"
        />
      )}
      
      {/* 🎯 Loading Skeleton */}
      {!isLoaded && isInView && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse rounded-xl"
          style={{ aspectRatio }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin"></div>
          </div>
        </div>
      )}
      
      {/* 🎯 Error State */}
      {hasError && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-red-800/20 flex items-center justify-center rounded-xl"
          style={{ aspectRatio }}
        >
          <div className="text-center text-red-400">
            <div className="text-2xl mb-2">⚠️</div>
            <div className="text-sm">Bild konnte nicht geladen werden</div>
          </div>
        </div>
      )}
    </div>
  );
});

LazyProductImage.displayName = 'LazyProductImage';
