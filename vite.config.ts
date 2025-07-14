/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          // Split services for better caching
          services: [
            './src/services/mgrsService.ts', 
            './src/services/fireDirectionService.ts'
          ],
          // Split database and heavy utilities
          database: ['./src/services/mortarDatabase.ts'],
          utils: ['./src/utils/dataCompression.ts']
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
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '0.0.0')
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['sqlite3'] // Exclude server-only dependencies from client bundle
  }
})
