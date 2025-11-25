import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";

const rootDir = __dirname;

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      "@nebula/shared": path.resolve(rootDir, "../../packages/shared/src/index.ts"),
      // Polyfills for Node.js modules
      "buffer": "buffer",
      "crypto": "crypto-browserify",
      "stream": "stream-browserify",
      "util": "util"
    }
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['buffer', 'crypto-browserify', 'stream-browserify', 'util']
  },
  build: {
    // Bundle size optimization
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-core';
          }

          // React Router
          if (id.includes('node_modules/react-router')) {
            return 'react-router';
          }

          // UI Libraries
          if (id.includes('node_modules/@radix-ui')) {
            return 'radix-ui';
          }

          // Icons
          if (id.includes('node_modules/lucide-react')) {
            return 'lucide-icons';
          }

          // State Management
          if (id.includes('node_modules/zustand') || id.includes('node_modules/@tanstack/react-query')) {
            return 'state-management';
          }

          // Animation
          if (id.includes('node_modules/framer-motion')) {
            return 'framer-motion';
          }

          // Utils
          if (id.includes('node_modules/clsx') || id.includes('node_modules/tailwind-merge')) {
            return 'utils';
          }

          // E-commerce components
          if (id.includes('/components/ecommerce/')) {
            return 'ecommerce';
          }

          // Dashboard components
          if (id.includes('/components/dashboard/')) {
            return 'dashboard';
          }

          // Tickets components
          if (id.includes('/components/tickets/')) {
            return 'tickets';
          }

          // Users components
          if (id.includes('/components/users/')) {
            return 'users';
          }

          // Security components
          if (id.includes('/components/security/')) {
            return 'security';
          }

          // System components
          if (id.includes('/components/system/')) {
            return 'system';
          }

          // Large vendor chunks
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 500, // Warn if chunk exceeds 500KB
    sourcemap: false, // Disable sourcemaps in production for smaller bundles
    minify: 'esbuild', // Use esbuild for faster minification
    target: 'esnext', // Target modern browsers
    cssCodeSplit: true, // Split CSS into separate chunks
  },
  server: {
    host: true,
    port: 5273,
    fs: {
      allow: [
        path.resolve(rootDir),
        path.resolve(rootDir, "../../packages")
      ]
    }
  },
  preview: {
    host: true,
    port: 4273
  }
});
