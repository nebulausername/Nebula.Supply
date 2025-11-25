import React, { useState } from 'react';
import { cn } from '../utils/cn';

interface AccessibleImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  fallbackText?: string;
  aspectRatio?: string;
  priority?: boolean;
}

export const AccessibleImage: React.FC<AccessibleImageProps> = ({
  src,
  alt,
  fallbackSrc,
  fallbackText,
  aspectRatio = '4 / 3',
  priority = false,
  className,
  onError,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setHasError(true);
    setIsLoading(false);
    onError?.(e);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  const imageSrc = hasError ? fallbackSrc : src;
  const imageAlt = hasError && fallbackText ? fallbackText : alt;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-white/10 bg-[#05070b]',
        className
      )}
      style={{ aspectRatio }}
      role="img"
      aria-label={imageAlt}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#05070b]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
        </div>
      )}
      
      {imageSrc ? (
        <img
          {...props}
          src={imageSrc}
          alt={imageAlt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className={cn(
            'h-full w-full object-cover transition-transform duration-500 group-hover:scale-105',
            isLoading && 'opacity-0'
          )}
          onError={handleError}
          onLoad={handleLoad}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/10 to-accent/5">
          <div className="text-center">
            <div className="mb-2 text-4xl">📷</div>
            <p className="text-sm text-muted">{fallbackText || 'Bild nicht verfügbar'}</p>
          </div>
        </div>
      )}
      
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(11,247,188,0.08),transparent_70%)]" />
    </div>
  );
};
