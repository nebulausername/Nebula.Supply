const preset = require("../../configs/tailwind.preset.cjs");

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [preset],
  content: ["./index.html", "./src/**/*.{ts,tsx,mdx}"],
  safelist: ["bg-accent", "bg-accentSecondary"],
  theme: {
    extend: {
      boxShadow: {
        card: "0 16px 32px rgba(11, 247, 188, 0.15)",
        neon: "0 0 0 1px rgba(139, 92, 246, 0.2), 0 8px 30px rgba(139, 92, 246, 0.15)"
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        },
        shine: {
          '0%': { transform: 'translateX(-200%)' },
          '100%': { transform: 'translateX(200%)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' }
        }
      },
      animation: {
        shimmer: 'shimmer 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in': 'fadeIn 0.3s ease-out',
        gradient: 'gradient 8s ease-in-out infinite',
        shine: 'shine 3s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite'
      },
      colors: {
        primary: '#8b5cf6',
        'primary-600': '#7c3aed',
        border: '#1f1f34'
      }
    }
  }
};
