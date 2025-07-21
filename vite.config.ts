import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    watch: {
      usePolling: true,
      interval: 1000,
      ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
    },
    fs: {
      strict: false,
    },
  },
  // Optimize build process for limited resources
  build: {
    target: 'es2015',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    minify: 'terser',
    terserOptions: {
      compress: {
        // Reduce memory usage
        sequences: false,
        passes: 1
      },
      format: {
        comments: false
      }
    },
    reportCompressedSize: false,
    assetsInlineLimit: 4096, // 4kb
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Create separate chunks for large dependencies
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('@radix-ui')) return 'vendor-radix';
            if (id.includes('lucide')) return 'vendor-lucide';
            return 'vendor'; // all other deps
          }
        }
      }
    }
  },
  // Optimize dependency scanning
  optimizeDeps: {
    force: true,
    esbuildOptions: {
      treeShaking: true,
    }
  },
}));
