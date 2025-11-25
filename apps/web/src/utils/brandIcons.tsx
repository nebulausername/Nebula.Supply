import React, { useState, useMemo } from "react";
import { Check, Sparkles, Crown, Snowflake, Waves } from "lucide-react";

/**
 * Brand Icon System
 * Professional SVG icons and typography-based logos for luxury brands
 */

// ============================================
// Brand Color Palette
// ============================================
export const brandColors: Record<string, string> = {
  NIKE: "#000000", // Black
  "AIR JORDAN": "#E82127", // Red
  NOCTA: "#000000", // Black
  "MAISON MARGIELA": "#000000", // Black
  CHANEL: "#000000", // Black & White
  LV: "#8B4513", // Brown
  GUCCI: "#1B4D3E", // Green
  MONCLER: "#000000", // Black
  "CANADA GOOSE": "#000000", // Black
  STÜSSY: "#000000", // Black
  CORTEIZ: "#000000", // Black
  "POLO RALPH LAUREN": "#003366", // Navy Blue
  GOYARD: "#000000", // Black
  FERRAGAMO: "#8B0000", // Dark Red
  BURBERRY: "#C9A961", // Tan
  BALENCIAGA: "#000000", // Black
  "C.P. COMPANY": "#E63946", // Red
  BBR: "#000000", // Black
};

// ============================================
// Custom SVG Brand Icons
// ============================================

// NIKE Swoosh Icon - Custom SVG
const NikeSwooshIcon = ({ size = 24, className = "", animated = false }: { size?: number; className?: string; animated?: boolean }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      onMouseEnter={() => animated && setIsHovered(true)}
      onMouseLeave={() => animated && setIsHovered(false)}
      style={{
        transform: animated && isHovered ? 'scale(1.1) rotate(-5deg)' : 'scale(1) rotate(0deg)',
        transition: animated ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
      }}
    >
      <path d="M2 8 C 6 4, 10 6, 12 8 C 14 10, 18 14, 20 16 C 20 18, 18 20, 16 18 C 14 16, 10 12, 8 10 C 6 8, 4 8, 2 8 Z" />
    </svg>
  );
};

// CHANEL Double-C Icon - Custom SVG
const ChanelDoubleCIcon = ({ size = 24, className = "", animated = false }: { size?: number; className?: string; animated?: boolean }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      onMouseEnter={() => animated && setIsHovered(true)}
      onMouseLeave={() => animated && setIsHovered(false)}
      style={{
        transform: animated && isHovered ? 'scale(1.1)' : 'scale(1)',
        transition: animated ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
      }}
    >
      {/* Left C */}
      <path d="M 8 12 C 8 9, 9 7, 11 7 C 13 7, 14 9, 14 12 C 14 15, 13 17, 11 17 C 9 17, 8 15, 8 12" />
      {/* Right C (interlaced) */}
      <path d="M 10 12 C 10 9.5, 10.5 8, 12 8 C 13.5 8, 14 9.5, 14 12 C 14 14.5, 13.5 16, 12 16 C 10.5 16, 10 14.5, 10 12" />
    </svg>
  );
};

// LV Monogram - Custom SVG (simplified)
const LouisVuittonIcon = ({ size = 24, className = "", animated = false }: { size?: number; className?: string; animated?: boolean }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      onMouseEnter={() => animated && setIsHovered(true)}
      onMouseLeave={() => animated && setIsHovered(false)}
      style={{
        transform: animated && isHovered ? 'scale(1.1)' : 'scale(1)',
        transition: animated ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
      }}
    >
      {/* Simplified LV pattern */}
      <path d="M4 4 L8 4 L8 20 L4 20 Z" />
      <path d="M6 4 L6 8 L12 20 L16 20 L10 8 L10 4 Z" />
      <path d="M16 4 L20 4 L20 20 L16 20 Z" />
    </svg>
  );
};

// GUCCI GG Icon - Custom SVG (simplified)
const GucciIcon = ({ size = 24, className = "", animated = false }: { size?: number; className?: string; animated?: boolean }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      onMouseEnter={() => animated && setIsHovered(true)}
      onMouseLeave={() => animated && setIsHovered(false)}
      style={{
        transform: animated && isHovered ? 'scale(1.1)' : 'scale(1)',
        transition: animated ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
      }}
    >
      {/* G pattern - simplified */}
      <path d="M 8 6 C 6 6, 4 8, 4 10 C 4 12, 6 14, 8 14 C 9 14, 10 13, 10 12" />
      <path d="M 14 6 C 16 6, 18 8, 18 10 C 18 12, 16 14, 14 14 C 13 14, 12 13, 12 12" />
    </svg>
  );
};

// ============================================
// Typography-Based Brand Logos
// ============================================

interface TypographyLogoProps {
  brandName: string;
  size?: number;
  className?: string;
  animated?: boolean;
}

const TypographyLogo = ({ brandName, size = 24, className = "", animated = false }: TypographyLogoProps) => {
  const [isHovered, setIsHovered] = useState(false);

  // Premium typography styling based on brand
  const getTypographyStyle = (brand: string) => {
    const styles: Record<string, React.CSSProperties> = {
      "POLO RALPH LAUREN": {
        fontFamily: "serif",
        fontWeight: "bold",
        letterSpacing: "0.05em",
      },
      BALENCIAGA: {
        fontFamily: "sans-serif",
        fontWeight: "300",
        letterSpacing: "0.2em",
        fontSize: `${size * 0.7}px`,
      },
      "C.P. COMPANY": {
        fontFamily: "monospace",
        fontWeight: "bold",
        letterSpacing: "0.1em",
      },
      BBR: {
        fontFamily: "sans-serif",
        fontWeight: "900",
        letterSpacing: "0.05em",
        fontSize: `${size * 0.65}px`,
      },
    };

    return styles[brand.toUpperCase()] || {
      fontFamily: "sans-serif",
      fontWeight: "600",
      letterSpacing: "0.05em",
    };
  };

  const style = getTypographyStyle(brandName);

  return (
    <div
      className={className}
      style={{
        ...style,
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: animated && isHovered ? 'scale(1.1)' : 'scale(1)',
        transition: animated ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
      }}
      onMouseEnter={() => animated && setIsHovered(true)}
      onMouseLeave={() => animated && setIsHovered(false)}
    >
      {brandName.toUpperCase().split(" ").map((word, idx) => (
        <span key={idx} style={{ fontSize: `${size * 0.45}px` }}>
          {word.substring(0, 1)}
        </span>
      ))}
    </div>
  );
};

// ============================================
// Brand Icon Mapping
// ============================================

type BrandIconType = 
  | React.ComponentType<{ size?: number; className?: string; animated?: boolean }>
  | "lucide-icon"
  | "typography"
  | string;

export const brandIconMap: Record<string, BrandIconType> = {
  NIKE: NikeSwooshIcon,
  "AIR JORDAN": "🏀", // Keep emoji for now, can be upgraded later
  NOCTA: "⭐",
  "MAISON MARGIELA": "🖤",
  CHANEL: ChanelDoubleCIcon,
  LV: LouisVuittonIcon,
  GUCCI: GucciIcon,
  MONCLER: Snowflake, // Lucide icon
  "CANADA GOOSE": "🪶",
  STÜSSY: Waves, // Lucide icon
  CORTEIZ: "🔷",
  "POLO RALPH LAUREN": "typography",
  GOYARD: "⚜️",
  FERRAGAMO: "🎀",
  BURBERRY: "🧥",
  BALENCIAGA: "typography",
  "C.P. COMPANY": "typography",
  BBR: "typography",
};

// ============================================
// Icon Cache System
// ============================================

const iconCache = new Map<string, React.ReactNode>();

const getCachedIcon = (brandName: string, renderFn: () => React.ReactNode): React.ReactNode => {
  const cacheKey = brandName.toUpperCase();
  
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey);
  }
  
  const icon = renderFn();
  iconCache.set(cacheKey, icon);
  return icon;
};

// ============================================
// Premium Brand Icon Component
// ============================================

interface BrandIconProps {
  brandName: string;
  size?: number;
  className?: string;
  animated?: boolean;
  showColor?: boolean;
}

export const BrandIcon = ({ 
  brandName, 
  size = 24, 
  className = "", 
  animated = false,
  showColor = true 
}: BrandIconProps) => {
  const brandUpper = brandName.toUpperCase();
  const iconType = brandIconMap[brandUpper];
  const brandColor = showColor ? brandColors[brandUpper] : undefined;

  // Get cached or render icon
  const icon = useMemo(() => {
    return getCachedIcon(brandUpper, () => {
      // Custom SVG component
      if (typeof iconType === "function" && iconType !== TypographyLogo) {
        const CustomIcon = iconType as React.ComponentType<{ size?: number; className?: string; animated?: boolean }>;
        return <CustomIcon size={size} className={className} animated={animated} />;
      }

      // Typography-based logo
      if (iconType === "typography") {
        return <TypographyLogo brandName={brandName} size={size} className={className} animated={animated} />;
      }

      // Lucide icon (wrapped)
      if (iconType === "lucide-icon" || (typeof iconType === "function" && iconType.prototype?.displayName?.includes("Lucide"))) {
        // This would need proper Lucide icon handling if needed
        return null;
      }

      // Simple string/emoji fallback
      if (typeof iconType === "string") {
        return <span style={{ fontSize: `${size}px`, lineHeight: 1 }}>{iconType}</span>;
      }

      // Default fallback
      return <span style={{ fontSize: `${size * 0.6}px` }}>▪</span>;
    });
  }, [brandUpper, size, className, animated, brandName, iconType]);

  return (
    <div 
      style={{ 
        color: brandColor || "currentColor",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      className={className}
    >
      {icon}
    </div>
  );
};

// ============================================
// Get Brand Icon (Backward Compatible)
// ============================================

/**
 * Get Brand Icon - Returns a React node for rendering
 * Backward compatible with previous string-based getBrandIcon
 * @param brandName - The brand name (case-insensitive)
 * @param size - Optional size for the icon (default: 24)
 * @returns React node to render
 */
export const getBrandIcon = (
  brandName: string,
  size: number = 24
): React.ReactNode => {
  if (!brandName) return <span>▪</span>;
  
  return (
    <BrandIcon
      brandName={brandName}
      size={size}
      animated={false}
      showColor={true}
    />
  );
};

// ============================================
// Export Brand Icon Map for Reference
// ============================================

export { brandIconMap as brandIconReference };

