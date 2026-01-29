import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Schema name for all RO tables
export const SCHEMA = 'branch_super_app_clawdbot';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: SCHEMA
  }
});
