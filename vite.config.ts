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
        '@': path.resolve(__dirname, 'src'),
      }
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // Extract the package name precisely
              const parts = id.split('node_modules/')[1].split('/');
              const pkg = parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];

              // Core React (only exact packages)
              if (['react', 'react-dom', 'scheduler'].includes(pkg)) {
                return 'vendor-core';
              }
              // Cloud services
              if (pkg.includes('supabase') || pkg.includes('firebase') || pkg.includes('capacitor')) {
                return 'vendor-cloud';
              }
              // Charting
              if (pkg.includes('recharts') || pkg.startsWith('d3-') || pkg.includes('victory')) {
                return 'vendor-ui';
              }
              // Export/PDF
              if (pkg.includes('jspdf') || pkg.includes('html2canvas') || pkg.includes('canvg')) {
                return 'vendor-export';
              }
            }
          }
        }
      }
    }
  };
});
