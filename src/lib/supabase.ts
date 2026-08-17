import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://toviibfyhauujydicjtn.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvdmlpYmZ5aGF1dWp5ZGljanRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NzYxOTEsImV4cCI6MjEwMjU1MjE5MX0.s9he8qdF18Uoq2ZD9Pc06lepbB1QUW_iwnxhnuaibns';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  if (typeof window !== 'undefined') {
    console.warn('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Check .env.local');
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
