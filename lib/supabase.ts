import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('Supabase Environment Check:', {
  url: supabaseUrl ? 'Loaded' : 'MISSING',
  key: supabaseKey ? 'Loaded' : 'MISSING',
  allEnvVars: import.meta.env
});

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    `Supabase configuration error:\n` +
    `- URL: ${supabaseUrl ? 'OK' : 'MISSING'}\n` +
    `- Key: ${supabaseKey ? 'OK' : 'MISSING'}\n` +
    `Please ensure .env file exists with VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY`
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
