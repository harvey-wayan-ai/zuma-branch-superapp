import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const SCHEMA = 'branch_super_app_clawdbot';

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: SCHEMA }
});
