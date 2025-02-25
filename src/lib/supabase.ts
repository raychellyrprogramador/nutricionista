import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Ensure environment variables are defined
const supabaseUrl = 'https://umxzyptutrmrytseogcx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVteHp5cHR1dHJtcnl0c2VvZ2N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2MjAyOTgsImV4cCI6MjA1NTE5NjI5OH0.wwzUONzpDOGcsJxDubzaVVt8IixEjBQ33NesK_zykYU';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});