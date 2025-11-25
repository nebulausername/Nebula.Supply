import type { LucideIcon } from "lucide-react";
import {
  ShoppingBag,
  Wallet,
  Zap,
  ChevronRight,
} from "lucide-react";
import type { Category } from "@nebula/shared";
import React, { useState } from "react";

/**
 * Premium Filled Icon Component Wrapper
 * Creates a filled/solid appearance from Lucide outline icons with animations
 */
interface FilledIconProps {
  Icon: LucideIcon;
  className?: string;
  size?: number;
  animated?: boolean;
  color?: string;
}

export const FilledIcon = ({ Icon, className = "", size = 24, animated = false, color }: FilledIconProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`relative inline-flex items-center justify-center ${className} ${animated ? 'transition-all duration-300' : ''}`}
      style={{ width: size, height: size }}
      onMouseEnter={() => animated && setIsHovered(true)}
      onMouseLeave={() => animated && setIsHovered(false)}
    >
      <Icon
        size={size}
        strokeWidth={2.5}
        className="text-current"
        style={{
          fill: "currentColor",
          stroke: "currentColor",
          color: color || "currentColor",
          transform: animated && isHovered ? 'scale(1.15) rotate(5deg)' : 'scale(1) rotate(0deg)',
          transition: animated ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
          filter: animated && isHovered ? 'drop-shadow(0 0 8px currentColor)' : 'none',
        }}
      />
    </div>
  );
};

// ============================================
// Premium Custom SVG Icons for All Categories
// ============================================

// Custom Sneaker Icon - Premium SVG with better design
const SneakerIcon = ({ size = 24, className = "", animated = false }: { size?: number; className?: string; animated?: boolean }) => {
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
        transform: animated && isHovered ? 'scale(1.15) rotate(-5deg)' : 'scale(1) rotate(0deg)',
        transition: animated ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
      }}
    >
      <path 
        d="M5 17h14v2H5v-2zm1-3l2-2 2 2 5-5 3 3-1 1H6v-1z" 
        fillRule="evenodd"
      />
      <circle cx="8" cy="16" r="1.5" fill="currentColor" opacity="0.6" />
      <circle cx="15" cy="16" r="1.5" fill="currentColor" opacity="0.6" />
      <path d="M4 15l1-1h14l1 1v2H4v-2z" fill="currentColor" opacity="0.3" />
    </svg>
  );
};

// Custom T-Shirt Icon - Premium SVG
const TShirtIcon = ({ size = 24, className = "", animated = false }: { size?: number; className?: string; animated?: boolean }) => {
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
        transform: animated && isHovered ? 'scale(1.15) rotate(5deg)' : 'scale(1) rotate(0deg)',
        transition: animated ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
      }}
    >
      {/* T-Shirt Body */}
      <path d="M6 4h12v12H6V4zm2 2v8h8V6H8z" fillRule="evenodd" />
      {/* Sleeves */}
      <path d="M4 6l2-2h12l2 2v2H4V6z" />
      <path d="M4 8h16v2H4V8z" fill="currentColor" opacity="0.4" />
      {/* Neck */}
      <path d="M10 4c0-1.1.9-2 2-2s2 .9 2 2v2h-4V4z" fill="currentColor" opacity="0.6" />
      {/* Bottom hem */}
      <path d="M6 14h12v2H6v-2z" fill="currentColor" opacity="0.3" />
    </svg>
  );
};

// Custom Pants Icon - Premium SVG with realistic structure
const PantsIcon = ({ size = 24, className = "", animated = false }: { size?: number; className?: string; animated?: boolean }) => {
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
        transform: animated && isHovered ? 'scale(1.15) rotate(-3deg)' : 'scale(1) rotate(0deg)',
        transition: animated ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
      }}
    >
      {/* Waistband */}
      <path d="M8 4h8v3H8V4z" fillRule="evenodd" />
      {/* Left leg */}
      <path d="M9 7v13H6V7h3z" />
      <path d="M7 7v13h2V7H7z" fill="currentColor" opacity="0.4" />
      {/* Right leg */}
      <path d="M15 7v13h3V7h-3z" />
      <path d="M15 7v13h2V7h-2z" fill="currentColor" opacity="0.4" />
      {/* Fly */}
      <path d="M11.5 4v6h1V4h-1z" fill="currentColor" opacity="0.5" />
      {/* Cuffs */}
      <path d="M6 20h3v1H6v-1z" fill="currentColor" opacity="0.6" />
      <path d="M15 20h3v1h-3v-1z" fill="currentColor" opacity="0.6" />
    </svg>
  );
};

// Custom Shorts Icon - Premium SVG
const ShortsIcon = ({ size = 24, className = "", animated = false }: { size?: number; className?: string; animated?: boolean }) => {
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
        transform: animated && isHovered ? 'scale(1.15) rotate(3deg)' : 'scale(1) rotate(0deg)',
        transition: animated ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
      }}
    >
      {/* Waistband */}
      <path d="M8 4h8v2.5H8V4z" fillRule="evenodd" />
      {/* Left leg */}
      <path d="M9 6.5v8H6v-8h3z" />
      <path d="M7 6.5v8h2v-8H7z" fill="currentColor" opacity="0.4" />
      {/* Right leg */}
      <path d="M15 6.5v8h3v-8h-3z" />
      <path d="M15 6.5v8h2v-8h-2z" fill="currentColor" opacity="0.4" />
      {/* Fly */}
      <path d="M11.5 4v6h1V4h-1z" fill="currentColor" opacity="0.5" />
      {/* Hem details */}
      <path d="M6 14.5h3v1H6v-1z" fill="currentColor" opacity="0.3" />
      <path d="M15 14.5h3v1h-3v-1z" fill="currentColor" opacity="0.3" />
    </svg>
  );
};

// Custom Caps/Beanie Icon - Premium SVG with 3D perspective
const CapsIcon = ({ size = 24, className = "", animated = false }: { size?: number; className?: string; animated?: boolean }) => {
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
        transform: animated && isHovered ? 'scale(1.15) rotate(-8deg)' : 'scale(1) rotate(0deg)',
        transition: animated ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
      }}
    >
      {/* Crown/Top */}
      <ellipse cx="12" cy="8" rx="8" ry="4" />
      <ellipse cx="12" cy="8" rx="6" ry="3" fill="currentColor" opacity="0.3" />
      {/* Brim */}
      <ellipse cx="12" cy="12" rx="10" ry="2" />
      <path d="M2 12l20 0" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      {/* Details */}
      <circle cx="12" cy="8" r="1.5" fill="currentColor" opacity="0.5" />
      <path d="M8 10 Q12 8 16 10" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4" />
    </svg>
  );
};

// Custom Watch Icon - Premium Watch Design
const WatchIcon = ({ size = 24, className = "", animated = false }: { size?: number; className?: string; animated?: boolean }) => {
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
        transform: animated && isHovered ? 'scale(1.15) rotate(15deg)' : 'scale(1) rotate(0deg)',
        transition: animated ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
      }}
    >
      {/* Watch Case */}
      <rect x="7" y="6" width="10" height="12" rx="2" />
      <rect x="8" y="7" width="8" height="10" rx="1.5" fill="currentColor" opacity="0.2" />
      {/* Watch Face */}
      <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.1" />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      {/* Hands */}
      <line x1="12" y1="12" x2="12" y2="9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      {/* Crown */}
      <rect x="11" y="4" width="2" height="2" rx="0.5" />
      {/* Lugs */}
      <rect x="6" y="10" width="1.5" height="4" rx="0.5" />
      <rect x="16.5" y="10" width="1.5" height="4" rx="0.5" />
      {/* Band */}
      <path d="M6 12h-2v1h2v-1z" />
      <path d="M18 12h2v1h-2v-1z" />
      {/* Dots at 12, 3, 6, 9 */}
      <circle cx="12" cy="9" r="0.5" />
      <circle cx="14" cy="12" r="0.5" />
      <circle cx="12" cy="15" r="0.5" />
      <circle cx="10" cy="12" r="0.5" />
    </svg>
  );
};

// Custom Hoodie Icon - Premium SVG with hood
const HoodieIcon = ({ size = 24, className = "", animated = false }: { size?: number; className?: string; animated?: boolean }) => {
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
        transform: animated && isHovered ? 'scale(1.15) rotate(-3deg)' : 'scale(1) rotate(0deg)',
        transition: animated ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
      }}
    >
      {/* Hood */}
      <path d="M8 3 Q12 5 16 3 Q18 4 18 7 Q18 10 16 9 Q12 7 8 9 Q6 10 6 7 Q6 4 8 3 Z" />
      <path d="M8 3 Q12 5 16 3 Q18 4 18 7 Q18 10 16 9 Q12 7 8 9 Q6 10 6 7 Q6 4 8 3 Z" fill="currentColor" opacity="0.3" />
      {/* Body */}
      <path d="M6 9h12v10H6V9zm2 2v6h8v-6H8z" fillRule="evenodd" />
      {/* Sleeves */}
      <path d="M4 9l2-2h12l2 2v2H4V9z" />
      <path d="M4 11h16v2H4v-2z" fill="currentColor" opacity="0.4" />
      {/* Pocket */}
      <path d="M10 14h4v3h-4v-3z" fill="currentColor" opacity="0.3" />
      <path d="M10 14h4v1h-4v-1z" fill="currentColor" opacity="0.5" />
      {/* Drawstrings */}
      <path d="M9 5 Q12 6 15 5" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
      <path d="M9 6 Q12 7 15 6" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
      {/* Bottom hem */}
      <path d="M6 17h12v2H6v-2z" fill="currentColor" opacity="0.3" />
    </svg>
  );
};

// Custom Jacket Icon - Premium SVG
const JacketIcon = ({ size = 24, className = "", animated = false }: { size?: number; className?: string; animated?: boolean }) => {
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
        transform: animated && isHovered ? 'scale(1.15) rotate(3deg)' : 'scale(1) rotate(0deg)',
        transition: animated ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
      }}
    >
      {/* Collar */}
      <path d="M10 3 L12 5 L14 3 L16 4 L16 6 L14 7 L12 6 L10 7 L8 6 L8 4 Z" />
      {/* Body */}
      <path d="M7 7h10v11H7V7zm2 2v7h6V9H9z" fillRule="evenodd" />
      {/* Sleeves */}
      <path d="M4 8l3-2h10l3 2v3H4V8z" />
      <path d="M4 11h16v2H4v-2z" fill="currentColor" opacity="0.4" />
      {/* Zipper */}
      <path d="M11.5 7v11h1V7h-1z" fill="currentColor" opacity="0.4" />
      <circle cx="12" cy="10" r="0.8" fill="currentColor" opacity="0.6" />
      <circle cx="12" cy="13" r="0.8" fill="currentColor" opacity="0.6" />
      <circle cx="12" cy="16" r="0.8" fill="currentColor" opacity="0.6" />
      {/* Pockets */}
      <path d="M8 11h3v2H8v-2z" fill="currentColor" opacity="0.3" />
      <path d="M13 11h3v2h-3v-2z" fill="currentColor" opacity="0.3" />
      {/* Bottom hem */}
      <path d="M7 18h10v1H7v-1z" fill="currentColor" opacity="0.3" />
    </svg>
  );
};

// Custom Accessories Icon - Premium SVG (Belt, Bag, etc.)
const AccessoriesIcon = ({ size = 24, className = "", animated = false }: { size?: number; className?: string; animated?: boolean }) => {
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
        transform: animated && isHovered ? 'scale(1.15) rotate(10deg)' : 'scale(1) rotate(0deg)',
        transition: animated ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
      }}
    >
      {/* Belt */}
      <path d="M3 12 L21 12 L21 14 L3 14 Z" />
      <rect x="10" y="12" width="4" height="2" fill="currentColor" opacity="0.4" />
      {/* Buckle */}
      <rect x="11" y="11" width="2" height="4" rx="0.5" />
      <circle cx="12" cy="13" r="0.8" fill="currentColor" opacity="0.6" />
      {/* Bag/Handbag */}
      <path d="M14 6 L18 6 L18 14 L14 14 Z" />
      <path d="M14 8 L18 8 L18 12 L14 12 Z" fill="currentColor" opacity="0.3" />
      {/* Bag handle */}
      <path d="M15 6 Q16 4 17 6" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Wallet */}
      <rect x="6" y="8" width="4" height="3" rx="0.5" />
      <rect x="7" y="9" width="2" height="1" fill="currentColor" opacity="0.4" />
    </svg>
  );
};

// Custom Tech Icon - Premium Design
const TechIcon = ({ size = 24, className = "", animated = false }: { size?: number; className?: string; animated?: boolean }) => {
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
        transform: animated && isHovered ? 'scale(1.15) rotate(-10deg)' : 'scale(1) rotate(0deg)',
        transition: animated ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
      }}
    >
      {/* Phone/Smartphone body */}
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <rect x="8" y="5" width="8" height="14" rx="1" fill="currentColor" opacity="0.2" />
      {/* Screen */}
      <rect x="9" y="6" width="6" height="10" rx="0.5" fill="currentColor" opacity="0.3" />
      {/* Home button / Notch */}
      <rect x="11" y="18" width="2" height="1.5" rx="0.5" fill="currentColor" opacity="0.6" />
      {/* Speaker */}
      <rect x="10" y="4" width="4" height="0.5" rx="0.25" />
      {/* Volume buttons */}
      <rect x="17.5" y="7" width="1" height="3" rx="0.5" />
      <rect x="17.5" y="11" width="1" height="3" rx="0.5" />
      {/* Camera */}
      <circle cx="12" cy="7" r="0.8" fill="currentColor" opacity="0.5" />
    </svg>
  );
};

// Custom Bundle Icon - Premium Gift Box Design
const BundleIcon = ({ size = 24, className = "", animated = false }: { size?: number; className?: string; animated?: boolean }) => {
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
        transform: animated && isHovered ? 'scale(1.15) rotate(5deg)' : 'scale(1) rotate(0deg)',
        transition: animated ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
      }}
    >
      {/* Box top */}
      <path d="M6 8 L12 5 L18 8 L18 10 L12 13 L6 10 Z" />
      <path d="M6 8 L12 5 L18 8" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
      {/* Box bottom */}
      <path d="M6 10 L12 13 L18 10 L18 16 L12 19 L6 16 Z" />
      <path d="M6 10 L6 16 M18 10 L18 16" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
      {/* Ribbon vertical */}
      <path d="M12 5 L12 19" stroke="currentColor" strokeWidth="2" opacity="0.6" />
      {/* Ribbon horizontal */}
      <path d="M6 13 L18 13" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      {/* Bow center */}
      <circle cx="12" cy="13" r="1.5" fill="currentColor" opacity="0.5" />
      {/* Gift tag / label */}
      <path d="M14 10 Q15 9 16 10 L15.5 12 Q14.5 13 13.5 12 Z" fill="currentColor" opacity="0.4" />
    </svg>
  );
};

/**
 * Category Icon Colors - Premium color palette for each category
 */
export const categoryIconColors: Record<string, string> = {
  "cat-shoes": "#A855F7", // Purple
  "cat-tshirt": "#3B82F6", // Blue
  "cat-pants": "#10B981", // Emerald
  "cat-shorts": "#06B6D4", // Cyan
  "cat-caps": "#F59E0B", // Amber
  "cat-watch": "#EC4899", // Pink
  "cat-hoodies": "#6366F1", // Indigo
  "cat-jackets": "#64748B", // Slate
  "cat-accessories": "#F472B6", // Pink
  "cat-tech": "#8B5CF6", // Violet
  "cat-bundle": "#EAB308", // Yellow
};

/**
 * Category Icon Mapping
 * Maps category IDs to custom SVG components or Lucide icons
 */
export const categoryIconMap: Record<string, LucideIcon | React.ComponentType<{ size?: number; className?: string; animated?: boolean }>> = {
  "cat-shoes": SneakerIcon as any,
  "cat-tshirt": TShirtIcon as any,
  "cat-pants": PantsIcon as any,
  "cat-shorts": ShortsIcon as any,
  "cat-caps": CapsIcon as any,
  "cat-watch": WatchIcon as any,
  "cat-hoodies": HoodieIcon as any,
  "cat-jackets": JacketIcon as any,
  "cat-accessories": AccessoriesIcon as any,
  "cat-tech": TechIcon as any,
  "cat-bundle": BundleIcon as any,
};

/**
 * Get category icon color
 */
export const getCategoryIconColor = (categoryId: string | null): string | undefined => {
  if (!categoryId) return undefined;
  return categoryIconColors[categoryId];
};

/**
 * Get Category Icon Component
 */
export const getCategoryIcon = (categoryId: string | null): LucideIcon | React.ComponentType<{ size?: number; className?: string }> | null => {
  if (!categoryId) return null;
  return categoryIconMap[categoryId] || null;
};

/**
 * Brand Icon System
 * Re-exported from brandIcons.tsx for backward compatibility
 */
export { getBrandIcon } from "./brandIcons";

/**
 * Custom Premium Icons (SVG-based for special categories)
 */

// Belt Icon - Custom SVG
export const BeltIcon = ({ className = "", size = 24 }: { className?: string; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12ZM12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5ZM8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12Z"
    />
  </svg>
);

// High Heels Icon - Custom SVG
export const HighHeelsIcon = ({ className = "", size = 24 }: { className?: string; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 3C8 2.44772 8.44772 2 9 2H15C15.5523 2 16 2.44772 16 3V7C16 7.55228 15.5523 8 15 8H14V10H16C17.1046 10 18 10.8954 18 12V14C18 15.1046 17.1046 16 16 16H15V18C15 19.1046 14.1046 20 13 20H11C9.89543 20 9 19.1046 9 18V16H8C6.89543 16 6 15.1046 6 14V12C6 10.8954 6.89543 10 8 10H10V8H9C8.44772 8 8 7.55228 8 7V3ZM10 8H14V6H10V8ZM10 12V14H14V12H10Z"
    />
  </svg>
);

// Handbag/Purse Icon - Custom SVG (more premium than ShoppingBag)
export const HandbagIcon = ({ className = "", size = 24 }: { className?: string; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7 5C5.89543 5 5 5.89543 5 7V17C5 18.1046 5.89543 19 7 19H17C18.1046 19 19 18.1046 19 17V7C19 5.89543 18.1046 5 17 5H7ZM7 7H17V17H7V7ZM9 9C9 8.44772 9.44772 8 10 8H14C14.5523 8 15 8.44772 15 9C15 9.55228 14.5523 10 14 10H10C9.44772 10 9 9.55228 9 9Z"
    />
  </svg>
);

/**
 * Get Icon Component for Category
 * Returns the appropriate icon component with filled styling, animations, and category-specific colors
 */
export const CategoryIcon = ({ 
  categoryId, 
  className = "", 
  size = 24,
  animated = false,
  showColor = true
}: { 
  categoryId: string | null; 
  className?: string; 
  size?: number;
  animated?: boolean;
  showColor?: boolean;
}) => {
  if (!categoryId) return null;

  const Icon = getCategoryIcon(categoryId);
  if (!Icon) return null;

  const iconColor = showColor ? getCategoryIconColor(categoryId) : undefined;

  // List of all custom SVG icon category IDs
  const customIconCategories = [
    "cat-shoes", "cat-tshirt", "cat-pants", "cat-shorts", "cat-caps",
    "cat-watch", "cat-hoodies", "cat-jackets", "cat-accessories", 
    "cat-tech", "cat-bundle"
  ];

  // Check if it's a custom SVG icon component
  if (customIconCategories.includes(categoryId)) {
    const CustomIcon = Icon as React.ComponentType<{ size?: number; className?: string; animated?: boolean }>;
    return (
      <div style={{ color: iconColor || "currentColor" }}>
        <CustomIcon size={size} className={className} animated={animated} />
      </div>
    );
  }

  // For Lucide icons, use FilledIcon wrapper
  try {
    return (
      <FilledIcon 
        Icon={Icon as LucideIcon} 
        className={className} 
        size={size}
        animated={animated}
        color={iconColor}
      />
    );
  } catch (error) {
    console.warn(`Icon rendering error for category ${categoryId}:`, error);
    return null;
  }
};

/**
 * Helper to render category icon as React component
 */
export const renderCategoryIcon = (category: Category | null, className = "", size = 24) => {
  if (!category) return null;
  
  // Special handling for sub-items in accessories
  if (category.id === "cat-accessories") {
    // Could add logic here for sub-item specific icons
    return <CategoryIcon categoryId={category.id} className={className} size={size} />;
  }

  return <CategoryIcon categoryId={category.id} className={className} size={size} />;
};

