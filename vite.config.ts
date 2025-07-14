/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/bundle-analysis.html',
      open: false,
      gzipSize: true,
      brotliSize: true
    })
  ],
  server: {
    port: 5173,
    // Enable compression for dev server
    middlewareMode: false,
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..']
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser'
  },
  // Enable compression
  assetsInclude: ['**/*.csv'],
  define: {
    __APP_VERSION__: JSON.stringify('2.0.0')
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['@vite/client', '@vite/env']
  },
  
  // Enable aggressive performance optimizations
  esbuild: {
    target: 'es2015',
    legalComments: 'none',
    treeShaking: true
  }
})
