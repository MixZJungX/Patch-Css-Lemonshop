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
      interval: 1000, // Check for file changes every second
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
    chunkSizeWarningLimit: 1000,
  },
  // Optimize dependency scanning
  optimizeDeps: {
    force: true,
    esbuildOptions: {
      treeShaking: true,
    }
  },
}));
