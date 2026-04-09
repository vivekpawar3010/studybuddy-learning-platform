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
        chunkSizeWarningLimit: 800,
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom', 'react-router-dom'],
              'vendor-firebase': ['firebase/app', 'firebase/auth'],
              'vendor-supabase': ['@supabase/supabase-js'],
              'vendor-tiptap': [
                '@tiptap/react',
                '@tiptap/starter-kit',
                '@tiptap/extension-color',
                '@tiptap/extension-highlight',
                '@tiptap/extension-image',
                '@tiptap/extension-link',
                '@tiptap/extension-placeholder',
                '@tiptap/extension-table',
                '@tiptap/extension-table-cell',
                '@tiptap/extension-table-header',
                '@tiptap/extension-table-row',
                '@tiptap/extension-text-align',
                '@tiptap/extension-text-style',
              ],
              'vendor-ai': ['@google/genai'],
              'vendor-ui': ['framer-motion', 'lucide-react', 'recharts'],
            }
          }
        }
      }
    };
});

