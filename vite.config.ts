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
    sourcemap: false, // Disable sourcemaps in production for smaller bundles
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace']
      },
      format: {
        comments: false
      }
    },
    cssCodeSplit: true,
    target: 'es2015', // Better compatibility and smaller bundles
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries more granularly
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          // Split UI components that are heavy
          'components-heavy': [
            './src/components/LandingPage.tsx',
            './src/components/MissionDashboard.tsx',
            './src/components/MissionPrepPage.tsx',
            './src/components/FireMissionPageNATO.tsx'
          ],
          // Split services for better caching
          services: [
            './src/services/mgrsService.ts', 
            './src/services/fireDirectionService.ts',
            './src/services/csvDataService.ts'
          ]
        },
        // Better chunk naming for caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.ts', '').replace('.tsx', '')
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return 'assets/[name]-[hash][extname]';
          const info = assetInfo.name.split('.');
          let extType = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = 'img';
          } else if (/woff|woff2|eot|ttf|otf/i.test(extType)) {
            extType = 'fonts';
          }
          return `${extType}/[name]-[hash][extname]`;
        }
      },
      external: (id) => {
        // Keep large CSV files external and load them dynamically
        return id.includes('.csv');
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000
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
