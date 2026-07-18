import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase = null;

if (supabaseUrl && supabaseKey && supabaseUrl !== 'your_supabase_url_here' && supabaseKey !== 'your_supabase_anon_key_here') {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('⚡ Supabase Client initialized for realtime delivery channels.');
  } catch (err) {
    console.warn('⚡ Failed to initialize Supabase client:', err.message);
  }
} else {
  console.log('⚡ Supabase credentials missing. Falling back to HTTP polling tracking mode.');
}

export default supabase;
