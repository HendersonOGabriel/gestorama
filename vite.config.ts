import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
      server: {
        port: 8080,
        host: 'localhost',
        allowedHosts: ['d2b2ecf5-5b1a-4c42-a724-9bf49d7199fb-00-1rme94zsj4bhq.spock.replit.dev'],
      },
      plugins: [
        react(),
        mode === 'development' && componentTagger(),
      ].filter(Boolean),
      define: {
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
          env.VITE_SUPABASE_URL || 'https://rbbkwsonvmfcworkmuro.supabase.co'
        ),
        'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(
          env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiYmt3c29udm1mY3dvcmttdXJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MTcwOTIsImV4cCI6MjA3ODI5MzA5Mn0.1KSE5QCHYV3yZ7o72599LPnGxxMwnO3sduheRmlBD3U'
        ),
        'import.meta.env.VITE_SUPABASE_PROJECT_ID': JSON.stringify(
          env.VITE_SUPABASE_PROJECT_ID || 'rbbkwsonvmfcworkmuro'
        ),
      },
      envPrefix: 'VITE_',
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      }
    };
});
