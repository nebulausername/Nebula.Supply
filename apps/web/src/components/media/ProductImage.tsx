import { useMemo, useState } from "react";
import { cn } from "../../utils/cn";
import { OptimizedImage } from "../OptimizedImage";

interface ProductImageProps {
  src?: string;
  alt: string;
  aspectRatio?: string;
  priority?: boolean;
  fallbackColor?: string;
  overlayLabel?: string;
  className?: string;
}

const createPlaceholder = (label: string, hex: string) => {
  const sanitizedLabel = label.length > 14 ? `${label.slice(0, 12)}…` : label;
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${hex}" stop-opacity="0.85"/><stop offset="50%" stop-color="#0B0F18" stop-opacity="0.9"/><stop offset="100%" stop-color="#020409" stop-opacity="0.95"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><text x="50%" y="52%" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-size="72" fill="#D1FAE5" letter-spacing="18">${sanitizedLabel.toUpperCase()}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export const ProductImage = ({
  src,
  alt,
  aspectRatio = "4 / 3",
  priority = false,
  fallbackColor = "#0BF7BC",
  overlayLabel,
  className
}: ProductImageProps) => {
  const [errored, setErrored] = useState(!src);
  const placeholder = useMemo(() => createPlaceholder(overlayLabel ?? alt, fallbackColor), [alt, overlayLabel, fallbackColor]);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl border border-white/10 bg-[#05070b]",
        className
      )}
      style={{ aspectRatio }}
    >
      {!errored && src ? (
        <OptimizedImage
          src={src}
          alt={alt}
          priority={priority}
          aspectRatio={aspectRatio}
          fallbackSrc={placeholder}
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => setErrored(true)}
        />
      ) : (
        <img
          src={placeholder}
          alt={alt}
          className="h-full w-full object-cover"
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(11,247,188,0.08),transparent_70%)]" />
    </div>
  );
};