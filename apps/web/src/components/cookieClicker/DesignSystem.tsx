import React from 'react';
import { cn } from '../../utils/cn';

// 🎨 MAXIMIERTES DESIGN SYSTEM - UX OWNER LEVEL!
export const DesignSystem = {
  // 🎯 COLOR PALETTE - GEIL & KONSISTENT!
  colors: {
    primary: {
      50: '#fef3c7',
      100: '#fde68a',
      200: '#fcd34d',
      300: '#fbbf24',
      400: '#f59e0b',
      500: '#d97706', // Main Orange
      600: '#b45309',
      700: '#92400e',
      800: '#78350f',
      900: '#451a03',
    },
    secondary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9', // Main Blue
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    accent: {
      50: '#fdf4ff',
      100: '#fae8ff',
      200: '#f5d0fe',
      300: '#f0abfc',
      400: '#e879f9',
      500: '#d946ef', // Main Purple
      600: '#c026d3',
      700: '#a21caf',
      800: '#86198f',
      900: '#701a75',
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e', // Main Green
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b', // Main Yellow
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444', // Main Red
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    }
  },

  // 🎯 TYPOGRAPHY - GEIL & LESBAR!
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      display: ['Poppins', 'Inter', 'sans-serif']
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
      '6xl': '3.75rem', // 60px
      '7xl': '4.5rem',  // 72px
      '8xl': '6rem',    // 96px
      '9xl': '8rem'     // 128px
    },
    fontWeight: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900'
    },
    lineHeight: {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2'
    }
  },

  // 🎯 SPACING - KONSISTENT & GEIL!
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
    32: '8rem',     // 128px
    40: '10rem',    // 160px
    48: '12rem',    // 192px
    56: '14rem',    // 224px
    64: '16rem'     // 256px
  },

  // 🎯 BORDER RADIUS - GEIL & MODERN!
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px'
  },

  // 🎯 SHADOWS - GEIL & TIEFE!
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    glow: '0 0 20px rgb(251 191 36 / 0.5)',
    glowBlue: '0 0 20px rgb(14 165 233 / 0.5)',
    glowPurple: '0 0 20px rgb(217 70 239 / 0.5)',
    glowGreen: '0 0 20px rgb(34 197 94 / 0.5)',
    glowRed: '0 0 20px rgb(239 68 68 / 0.5)'
  },

  // 🎯 ANIMATIONS - GEIL & SMOOTH!
  animations: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
      slower: '750ms',
      slowest: '1000ms'
    },
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      smoothOut: 'cubic-bezier(0, 0, 0.2, 1)',
      smoothIn: 'cubic-bezier(0.4, 0, 1, 1)'
    }
  }
};

// 🎨 DESIGN SYSTEM COMPONENTS - UX OWNER LEVEL!
export const DesignComponents = {
  // 🎯 BUTTON VARIANTS - GEIL & KONSISTENT!
  Button: {
    base: "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
    variants: {
      primary: "bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl focus:ring-orange-500",
      secondary: "bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl focus:ring-blue-500",
      accent: "bg-purple-500 hover:bg-purple-600 text-white shadow-lg hover:shadow-xl focus:ring-purple-500",
      success: "bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl focus:ring-green-500",
      warning: "bg-yellow-500 hover:bg-yellow-600 text-black shadow-lg hover:shadow-xl focus:ring-yellow-500",
      error: "bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl focus:ring-red-500",
      outline: "border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white focus:ring-orange-500",
      ghost: "text-orange-500 hover:bg-orange-500/10 focus:ring-orange-500",
      link: "text-orange-500 hover:text-orange-600 underline-offset-4 hover:underline focus:ring-orange-500"
    },
    sizes: {
      sm: "px-3 py-1.5 text-sm",
      base: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
      xl: "px-8 py-4 text-xl"
    }
  },

  // 🎯 CARD VARIANTS - GEIL & MODERN!
  Card: {
    base: "rounded-xl border transition-all duration-200",
    variants: {
      default: "bg-white/5 border-white/10 hover:bg-white/10",
      primary: "bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20",
      secondary: "bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20",
      accent: "bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20",
      success: "bg-green-500/10 border-green-500/20 hover:bg-green-500/20",
      warning: "bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20",
      error: "bg-red-500/10 border-red-500/20 hover:bg-red-500/20",
      glow: "shadow-lg hover:shadow-xl",
      glowOrange: "shadow-glow hover:shadow-glow",
      glowBlue: "shadow-glowBlue hover:shadow-glowBlue",
      glowPurple: "shadow-glowPurple hover:shadow-glowPurple",
      glowGreen: "shadow-glowGreen hover:shadow-glowGreen",
      glowRed: "shadow-glowRed hover:shadow-glowRed"
    },
    sizes: {
      sm: "p-3",
      base: "p-4",
      lg: "p-6",
      xl: "p-8"
    }
  },

  // 🎯 INPUT VARIANTS - GEIL & ACCESSIBLE!
  Input: {
    base: "w-full rounded-lg border bg-transparent px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
    variants: {
      default: "border-white/20 text-white placeholder-white/50 focus:border-orange-500 focus:ring-orange-500",
      primary: "border-orange-500/30 text-white placeholder-orange-500/50 focus:border-orange-500 focus:ring-orange-500",
      secondary: "border-blue-500/30 text-white placeholder-blue-500/50 focus:border-blue-500 focus:ring-blue-500",
      accent: "border-purple-500/30 text-white placeholder-purple-500/50 focus:border-purple-500 focus:ring-purple-500",
      success: "border-green-500/30 text-white placeholder-green-500/50 focus:border-green-500 focus:ring-green-500",
      warning: "border-yellow-500/30 text-white placeholder-yellow-500/50 focus:border-yellow-500 focus:ring-yellow-500",
      error: "border-red-500/30 text-white placeholder-red-500/50 focus:border-red-500 focus:ring-red-500"
    },
    sizes: {
      sm: "px-2 py-1 text-sm",
      base: "px-3 py-2 text-base",
      lg: "px-4 py-3 text-lg"
    }
  },

  // 🎯 BADGE VARIANTS - GEIL & INFORMATIV!
  Badge: {
    base: "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
    variants: {
      default: "bg-white/10 text-white",
      primary: "bg-orange-500/20 text-orange-200",
      secondary: "bg-blue-500/20 text-blue-200",
      accent: "bg-purple-500/20 text-purple-200",
      success: "bg-green-500/20 text-green-200",
      warning: "bg-yellow-500/20 text-yellow-200",
      error: "bg-red-500/20 text-red-200"
    }
  },

  // 🎯 PROGRESS VARIANTS - GEIL & VISUAL!
  Progress: {
    base: "w-full rounded-full bg-white/10 overflow-hidden",
    variants: {
      default: "bg-white/10",
      primary: "bg-orange-500/20",
      secondary: "bg-blue-500/20",
      accent: "bg-purple-500/20",
      success: "bg-green-500/20",
      warning: "bg-yellow-500/20",
      error: "bg-red-500/20"
    },
    sizes: {
      sm: "h-1",
      base: "h-2",
      lg: "h-3",
      xl: "h-4"
    }
  }
};

// 🎨 UTILITY FUNCTIONS - UX OWNER LEVEL!
export const DesignUtils = {
  // 🎯 GET BUTTON CLASSES - GEIL & FLEXIBLE!
  getButtonClasses: (variant: keyof typeof DesignComponents.Button.variants, size: keyof typeof DesignComponents.Button.sizes, className?: string) => {
    return cn(
      DesignComponents.Button.base,
      DesignComponents.Button.variants[variant],
      DesignComponents.Button.sizes[size],
      className
    );
  },

  // 🎯 GET CARD CLASSES - GEIL & FLEXIBLE!
  getCardClasses: (variant: keyof typeof DesignComponents.Card.variants, size: keyof typeof DesignComponents.Card.sizes, className?: string) => {
    return cn(
      DesignComponents.Card.base,
      DesignComponents.Card.variants[variant],
      DesignComponents.Card.sizes[size],
      className
    );
  },

  // 🎯 GET INPUT CLASSES - GEIL & FLEXIBLE!
  getInputClasses: (variant: keyof typeof DesignComponents.Input.variants, size: keyof typeof DesignComponents.Input.sizes, className?: string) => {
    return cn(
      DesignComponents.Input.base,
      DesignComponents.Input.variants[variant],
      DesignComponents.Input.sizes[size],
      className
    );
  },

  // 🎯 GET BADGE CLASSES - GEIL & FLEXIBLE!
  getBadgeClasses: (variant: keyof typeof DesignComponents.Badge.variants, className?: string) => {
    return cn(
      DesignComponents.Badge.base,
      DesignComponents.Badge.variants[variant],
      className
    );
  },

  // 🎯 GET PROGRESS CLASSES - GEIL & FLEXIBLE!
  getProgressClasses: (variant: keyof typeof DesignComponents.Progress.variants, size: keyof typeof DesignComponents.Progress.sizes, className?: string) => {
    return cn(
      DesignComponents.Progress.base,
      DesignComponents.Progress.variants[variant],
      DesignComponents.Progress.sizes[size],
      className
    );
  }
};

export default DesignSystem;





