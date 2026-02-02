const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rwctwnzckyepiwcufdlw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Y3R3bnpja3llcGl3Y3VmZGx3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU3MDI5MywiZXhwIjoyMDc1MTQ2MjkzfQ.0amj_ztVNgHZdU-LAfk-QvDQATGy-dVezEg6HYHLrec',
  { db: { schema: 'branch_super_app_clawdbot' } }
);

async function test() {
  const tables = ['ro_process', 'ro_sessions', 'ro_items', 'ro_stockwhs', 'ro_recommendations', 'ro_whs_readystock'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(table + ': ERROR - ' + error.message);
    } else {
      console.log(table + ': OK (columns: ' + Object.keys(data[0] || {}).join(', ') + ')');
    }
  }
}
test();
