import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), tailwindcss()],
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
        // Main app bundle is large; 2MB threshold avoids noise on a feature-rich SPA
        chunkSizeWarningLimit: 2000,
        rollupOptions: {
          output: {
            manualChunks(id: string) {
              // React + Router
              if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
                return 'vendor-react';
              }
              // Firebase
              if (id.includes('node_modules/firebase')) {
                return 'vendor-firebase';
              }
              // Supabase
              if (id.includes('node_modules/@supabase')) {
                return 'vendor-supabase';
              }
              // TipTap — isolated so it never pulls framer-motion or lucide
              if (id.includes('node_modules/@tiptap')) {
                return 'vendor-tiptap';
              }
              // Google AI SDK
              if (id.includes('node_modules/@google/genai')) {
                return 'vendor-ai';
              }
              // Animation library — separate from tiptap to break circular dep
              if (id.includes('node_modules/framer-motion')) {
                return 'vendor-motion';
              }
              // Icon library — separate chunk
              if (id.includes('node_modules/lucide-react')) {
                return 'vendor-icons';
              }
              // Charts
              if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) {
                return 'vendor-charts';
              }
            },
          }
        }
      }
    };
});
