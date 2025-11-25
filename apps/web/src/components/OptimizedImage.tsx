import { useState, ImgHTMLAttributes, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'placeholder' | 'src' | 'srcSet'> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  showSkeleton?: boolean;
  aspectRatio?: string;
  sizes?: string;
  priority?: boolean;
  enableWebP?: boolean;
  enableAVIF?: boolean;
}

// Generate responsive srcSet with multiple formats
const generateSrcSet = (src: string, enableWebP = true, enableAVIF = true): { srcSet: string; type?: string }[] => {
  const baseUrl = src.split('?')[0];
  const params = src.includes('?') ? src.split('?')[1] : '';
  
  const sizes = [400, 800, 1200, 1600, 2000];
  const formats: Array<{ ext: string; type?: string; enabled: boolean }> = [
    { ext: 'webp', type: 'image/webp', enabled: enableWebP },
    { ext: 'avif', type: 'image/avif', enabled: enableAVIF },
    { ext: '', type: undefined, enabled: true } // Original format as fallback
  ];

  const result: { srcSet: string; type?: string }[] = [];

  formats.forEach(format => {
    if (!format.enabled) return;
    
    const srcSet = sizes
      .map(size => {
        const url = format.ext 
          ? `${baseUrl.replace(/\.[^.]+$/, '')}.${format.ext}?w=${size}${params ? `&${params}` : ''}`
          : `${baseUrl}?w=${size}${params ? `&${params}` : ''}`;
        return `${url} ${size}w`;
      })
      .join(', ');
    
    result.push({ srcSet, type: format.type });
  });

  return result;
};

export const OptimizedImage = ({
  src,
  alt,
  fallbackSrc = '/placeholder.webp',
  showSkeleton = true,
  aspectRatio,
  className = '',
  priority = false,
  enableWebP = true,
  enableAVIF = true,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  ...props
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver>();

  // Generate srcSet for responsive images
  const imageSources = useMemo(() => {
    if (!src || hasError) return [];
    return generateSrcSet(src, enableWebP, enableAVIF);
  }, [src, enableWebP, enableAVIF, hasError]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView || !imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.disconnect();
          }
        });
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority, isInView]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true);
    if (fallbackSrc && e.currentTarget.src !== fallbackSrc) {
      e.currentTarget.src = fallbackSrc;
    }
  };

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Skeleton Loader */}
      {showSkeleton && !isLoaded && !hasError && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5"
          animate={{
            x: ['-100%', '200%']
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      )}

      {/* Picture element with multiple sources for format optimization */}
      {isInView && imageSources.length > 0 ? (
        <picture>
          {/* AVIF source (best compression) */}
          {imageSources.find(s => s.type === 'image/avif') && (
            <source
              srcSet={imageSources.find(s => s.type === 'image/avif')!.srcSet}
              type="image/avif"
              sizes={sizes}
            />
          )}
          {/* WebP source (good compression) */}
          {imageSources.find(s => s.type === 'image/webp') && (
            <source
              srcSet={imageSources.find(s => s.type === 'image/webp')!.srcSet}
              type="image/webp"
              sizes={sizes}
            />
          )}
          {/* Fallback image */}
          <motion.img
            ref={imgRef}
            src={src}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{
              opacity: isLoaded ? 1 : 0,
              scale: isLoaded ? 1 : 1.1
            }}
            transition={{ duration: 0.3 }}
            className={`w-full h-full object-cover ${isLoaded ? '' : 'invisible'}`}
            fetchPriority={priority ? 'high' : 'low'}
            sizes={sizes}
            {...(props as any)}
          />
        </picture>
      ) : (
        // Fallback for when image is not in view yet
        <img
          ref={imgRef}
          src={priority ? src : undefined}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full object-cover ${isLoaded ? '' : 'invisible'}`}
          fetchPriority={priority ? 'high' : 'low'}
          {...(props as any)}
        />
      )}
    </div>
  );
};



