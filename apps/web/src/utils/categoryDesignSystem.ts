import type { Category } from "@nebula/shared";

export interface CategoryDesignConfig {
  accentColor: string;
  accentHover: string;
  backgroundTint: string;
  borderColor: string;
  badgeColor: string;
  gradient: string;
  iconSize: string;
  neumorphismClass?: string; // Neumorphism CSS class
}

export interface CategoryDesignSystem {
  [categoryId: string]: CategoryDesignConfig;
}

// Premium Design System für alle Kategorien
export const categoryDesignSystem: CategoryDesignSystem = {
  'cat-shoes': {
    accentColor: 'text-purple-400',
    accentHover: 'text-purple-300',
    backgroundTint: 'bg-purple-900/10',
    borderColor: 'border-purple-500/40',
    badgeColor: 'bg-purple-500/20 text-purple-300',
    gradient: 'from-purple-900/30 via-purple-800/20 to-purple-900/30',
    iconSize: 'text-2xl',
    neumorphismClass: 'neumorphism-purple',
  },
  'cat-tshirt': {
    accentColor: 'text-blue-400',
    accentHover: 'text-blue-300',
    backgroundTint: 'bg-blue-900/10',
    borderColor: 'border-blue-500/40',
    badgeColor: 'bg-blue-500/20 text-blue-300',
    gradient: 'from-blue-900/30 via-blue-800/20 to-blue-900/30',
    iconSize: 'text-2xl',
    neumorphismClass: 'neumorphism-blue',
  },
  'cat-pants': {
    accentColor: 'text-emerald-400',
    accentHover: 'text-emerald-300',
    backgroundTint: 'bg-emerald-900/10',
    borderColor: 'border-emerald-500/40',
    badgeColor: 'bg-emerald-500/20 text-emerald-300',
    gradient: 'from-emerald-900/30 via-emerald-800/20 to-emerald-900/30',
    iconSize: 'text-2xl',
    neumorphismClass: 'neumorphism-emerald',
  },
  'cat-shorts': {
    accentColor: 'text-cyan-400',
    accentHover: 'text-cyan-300',
    backgroundTint: 'bg-cyan-900/10',
    borderColor: 'border-cyan-500/40',
    badgeColor: 'bg-cyan-500/20 text-cyan-300',
    gradient: 'from-cyan-900/30 via-cyan-800/20 to-cyan-900/30',
    iconSize: 'text-2xl',
    neumorphismClass: 'neumorphism-blue',
  },
  'cat-caps': {
    accentColor: 'text-amber-400',
    accentHover: 'text-amber-300',
    backgroundTint: 'bg-amber-900/10',
    borderColor: 'border-amber-500/40',
    badgeColor: 'bg-amber-500/20 text-amber-300',
    gradient: 'from-amber-900/30 via-amber-800/20 to-amber-900/30',
    iconSize: 'text-2xl',
    neumorphismClass: 'neumorphism-soft',
  },
  'cat-watch': {
    accentColor: 'text-rose-400',
    accentHover: 'text-rose-300',
    backgroundTint: 'bg-rose-900/10',
    borderColor: 'border-rose-500/40',
    badgeColor: 'bg-rose-500/20 text-rose-300',
    gradient: 'from-rose-900/30 via-rose-800/20 to-rose-900/30',
    iconSize: 'text-2xl',
    neumorphismClass: 'neumorphism-soft',
  },
  'cat-hoodies': {
    accentColor: 'text-indigo-400',
    accentHover: 'text-indigo-300',
    backgroundTint: 'bg-indigo-900/10',
    borderColor: 'border-indigo-500/40',
    badgeColor: 'bg-indigo-500/20 text-indigo-300',
    gradient: 'from-indigo-900/30 via-indigo-800/20 to-indigo-900/30',
    iconSize: 'text-2xl',
    neumorphismClass: 'neumorphism-purple',
  },
  'cat-jackets': {
    accentColor: 'text-slate-400',
    accentHover: 'text-slate-300',
    backgroundTint: 'bg-slate-900/10',
    borderColor: 'border-slate-500/40',
    badgeColor: 'bg-slate-500/20 text-slate-300',
    gradient: 'from-slate-900/30 via-slate-800/20 to-slate-900/30',
    iconSize: 'text-2xl',
    neumorphismClass: 'neumorphism-soft',
  },
  'cat-accessories': {
    accentColor: 'text-pink-400',
    accentHover: 'text-pink-300',
    backgroundTint: 'bg-pink-900/10',
    borderColor: 'border-pink-500/40',
    badgeColor: 'bg-pink-500/20 text-pink-300',
    gradient: 'from-pink-900/30 via-pink-800/20 to-pink-900/30',
    iconSize: 'text-2xl',
    neumorphismClass: 'neumorphism-soft',
  },
  'cat-tech': {
    accentColor: 'text-violet-400',
    accentHover: 'text-violet-300',
    backgroundTint: 'bg-violet-900/10',
    borderColor: 'border-violet-500/40',
    badgeColor: 'bg-violet-500/20 text-violet-300',
    gradient: 'from-violet-900/30 via-violet-800/20 to-violet-900/30',
    iconSize: 'text-2xl',
    neumorphismClass: 'neumorphism-purple',
  },
  'cat-bundle': {
    accentColor: 'text-yellow-400',
    accentHover: 'text-yellow-300',
    backgroundTint: 'bg-yellow-900/10',
    borderColor: 'border-yellow-500/40',
    badgeColor: 'bg-yellow-500/20 text-yellow-300',
    gradient: 'from-yellow-900/30 via-yellow-800/20 to-yellow-900/30',
    iconSize: 'text-2xl',
    neumorphismClass: 'neumorphism-soft',
  },
};

// Default Design für unbekannte Kategorien
export const defaultDesign: CategoryDesignConfig = {
  accentColor: 'text-accent',
  accentHover: 'text-accent/80',
  backgroundTint: 'bg-black/20',
  borderColor: 'border-white/20',
  badgeColor: 'bg-accent/20 text-accent',
  gradient: 'from-black/40 via-black/30 to-black/40',
  iconSize: 'text-2xl',
};

// Get Design Config für eine Kategorie
export const getCategoryDesign = (categoryId: string | null): CategoryDesignConfig => {
  if (!categoryId) return defaultDesign;
  return categoryDesignSystem[categoryId] || defaultDesign;
};

// Icon Mapping für Sub-Items / Marken
export const brandIconMap: Record<string, string> = {
  'NIKE': '✓',
  'AIR JORDAN': '🏀',
  'NOCTA': '⭐',
  'MAISON MARGIELA': '🖤',
  'CHANEL': '💎',
  'LV': '👑',
  'GUCCI': '🦁',
  'MONCLER': '❄️',
  'CANADA GOOSE': '🪶',
  'STÜSSY': '🌊',
  'CORTEIZ': '🔷',
  'POLO RALPH LAUREN': '🐴',
  'GOYARD': '⚜️',
  'FERRAGAMO': '🎀',
  'BURBERRY': '🧥',
  'BALENCIAGA': '🔸',
  'C.P. COMPANY': '🔴',
  'BBR': '🔴',
};

// Get Icon für Brand/Sub-Item
export const getBrandIcon = (name: string): string => {
  return brandIconMap[name] || '▪️';
};

// Animation Configs
export const animationConfig = {
  staggerDelay: 50, // ms zwischen Sub-Items
  fadeInDuration: 300, // ms
  scaleInDuration: 200, // ms
  hoverScale: 1.05, // scale factor
  hoverTransition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
};

