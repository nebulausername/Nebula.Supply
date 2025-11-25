const tokens = require("../packages/shared/tokens.json");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: tokens.colors.background.default,
        surface: tokens.colors.background.surface,
        text: tokens.colors.text.primary,
        muted: tokens.colors.text.secondary,
        accent: tokens.colors.accent.primary,
        accentSecondary: tokens.colors.accent.secondary,
        success: tokens.colors.status.success,
        warning: tokens.colors.status.warning,
        danger: tokens.colors.status.error
      },
      borderRadius: {
        lg: tokens.radii.lg,
        md: tokens.radii.md,
        sm: tokens.radii.sm
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      // Fluid typography with clamp
      fontSize: {
        'fluid-xs': 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
        'fluid-sm': 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)',
        'fluid-base': 'clamp(1rem, 0.95rem + 0.25vw, 1.125rem)',
        'fluid-lg': 'clamp(1.125rem, 1rem + 0.625vw, 1.5rem)',
        'fluid-xl': 'clamp(1.25rem, 1.1rem + 0.75vw, 1.875rem)',
        'fluid-2xl': 'clamp(1.5rem, 1.3rem + 1vw, 2.25rem)',
        'fluid-3xl': 'clamp(1.875rem, 1.5rem + 1.875vw, 3rem)',
        'fluid-4xl': 'clamp(2.25rem, 1.75rem + 2.5vw, 4rem)',
        'fluid-5xl': 'clamp(3rem, 2.25rem + 3.75vw, 5rem)',
      },
      // Safe area insets for iOS notch
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      // Touch target sizes (minimum 44x44px)
      minHeight: {
        'touch': '44px',
        'touch-lg': '56px',
      },
      minWidth: {
        'touch': '44px',
        'touch-lg': '56px',
      },
      // Container queries support
      containers: {
        'xs': '20rem',
        'sm': '24rem',
        'md': '28rem',
        'lg': '32rem',
        'xl': '36rem',
        '2xl': '42rem',
        '3xl': '48rem',
        '4xl': '56rem',
        '5xl': '64rem',
        '6xl': '72rem',
        '7xl': '80rem',
      },
      // Breakpoints for adaptive layouts
      screens: {
        'xs': '320px',
        'sm': '480px',   // Small phones
        'md': '768px',   // Tablets
        'lg': '1024px',  // Desktop
        'xl': '1440px',  // Large Desktop
        '2xl': '1920px', // Ultra-Wide
        // Container query breakpoints
        '@xs': '20rem',
        '@sm': '24rem',
        '@md': '28rem',
        '@lg': '32rem',
      }
    }
  },
  plugins: [
    // Container queries plugin (requires @tailwindcss/container-queries)
    function({ addUtilities }) {
      addUtilities({
        '.container-query': {
          containerType: 'inline-size',
        },
        '.container-query-normal': {
          containerType: 'normal',
        },
      });
    }
  ]
};
