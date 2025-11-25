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
      "util": "util",
      "events": "events",
      "process": "process/browser"
    },
    // Ensure React is deduplicated to prevent multiple instances
    dedupe: ["react", "react-dom"]
  },
  define: {
    global: 'globalThis',
    // Replace any occurrences of process.env at build/dev time with an empty object
    'process.env': {},
    // Provide a lightweight process shim reference
    'process': 'process'
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'buffer', 'crypto-browserify', 'stream-browserify', 'util', 'events', 'process/browser']
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        timeout: 10000,
        proxyTimeout: 10000,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, res) => {
            // Silently handle connection errors to prevent console spam
            if (res && !res.headersSent) {
              res.writeHead(503, {
                'Content-Type': 'application/json',
              });
              res.end(JSON.stringify({ 
                error: 'Service temporarily unavailable',
                message: 'API server is not responding'
              }));
            }
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Set timeout for requests
            proxyReq.setTimeout(10000, () => {
              if (!res.headersSent) {
                res.writeHead(504, {
                  'Content-Type': 'application/json',
                });
                res.end(JSON.stringify({ 
                  error: 'Gateway timeout',
                  message: 'Request timed out'
                }));
              }
            });
          });
        }
      }
    },
    fs: {
      allow: [
        path.resolve(rootDir),
        path.resolve(rootDir, "../../packages")
      ]
    }
  },
  preview: {
    host: true,
    port: 4173
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            // Router
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            // UI libraries
            if (id.includes('@radix-ui')) {
              return 'vendor-ui';
            }
            // Animation
            if (id.includes('framer-motion')) {
              return 'vendor-animation';
            }
            // State management
            if (id.includes('zustand') || id.includes('immer')) {
              return 'vendor-state';
            }
            // Icons - tree-shake lucide-react
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            // Query
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query';
            }
            // Utilities
            if (id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'vendor-utils';
            }
            // Other node_modules
            return 'vendor-other';
          }
          // Page chunks for better code splitting
          if (id.includes('/pages/')) {
            const pageName = id.split('/pages/')[1]?.split('.')[0];
            if (pageName) {
              return `page-${pageName}`;
            }
          }
          // Component chunks for heavy components
          if (id.includes('/components/cookieClicker/')) {
            return 'chunk-cookie-clicker';
          }
          if (id.includes('/components/drops/')) {
            return 'chunk-drops';
          }
          if (id.includes('/components/shop/')) {
            return 'chunk-shop';
          }
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    chunkSizeWarningLimit: 500,
    sourcemap: false,
    minify: 'esbuild',
    // Target modern browsers for smaller bundles
    target: 'esnext',
    // Enable tree shaking
    treeshake: {
      moduleSideEffects: false
    }
  }
});
