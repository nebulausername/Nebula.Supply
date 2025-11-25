const preset = require("../../configs/tailwind.preset.cjs");

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [preset],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        'orbitron': ['Orbitron', 'system-ui', 'monospace'],
        'space-grotesk': ['Space Grotesk', 'system-ui', 'sans-serif'],
        'inter': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'system-ui', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },
      boxShadow: {
        card: "0 12px 28px rgba(11, 247, 188, 0.12)",
        'neon': "0 0 20px rgba(11, 247, 188, 0.3)",
        'neon-strong': "0 0 30px rgba(11, 247, 188, 0.5)",
      },
      colors: {
        'neon': '#0bf7bc',
        'neon-dark': '#08c896',
      }
    }
  }
};
