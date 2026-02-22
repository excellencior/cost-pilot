import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
                return 'vendor-core';
              }
              if (id.includes('supabase') || id.includes('firebase') || id.includes('capacitor')) {
                return 'vendor-cloud';
              }
              if (id.includes('recharts') || id.includes('d3') || id.includes('victory')) {
                return 'vendor-ui';
              }
              if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('canvg')) {
                return 'vendor-export';
              }
              return 'vendor-others';
            }
          }
        }
      }
    }
  };
});
