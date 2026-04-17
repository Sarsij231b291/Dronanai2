import { createClient } from '@supabase/supabase-js';

// ─── Replace these with your actual Supabase project credentials ───────────
// Go to: https://supabase.com → Your Project → Settings → API
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';
// ──────────────────────────────────────────────────────────────────────────

// Fallback to a valid URL structure if the .env placeholder hasn't been replaced yet
// to prevent the app from crashing with a blank screen.
const safeUrl = SUPABASE_URL.startsWith('http') ? SUPABASE_URL : 'https://placeholder.supabase.co';

export const supabase = createClient(safeUrl, SUPABASE_ANON_KEY);
