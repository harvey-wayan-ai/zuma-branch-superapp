const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rwctwnzckyepiwcufdlw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Y3R3bnpja3llcGl3Y3VmZGx3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU3MDI5MywiZXhwIjoyMDc1MTQ2MjkzfQ.0amj_ztVNgHZdU-LAfk-QvDQATGy-dVezEg6HYHLrec',
  { db: { schema: 'branch_super_app_clawdbot' } }
);

async function explore() {
  const potentialTables = [
    'ro_process',
    'ro_recommendations',
    'ro_recommendation_jatim',
    'ro_id_sequences',
    'master_mutasi_whs',
    'supabase_transkasiDDD',
    'supabase_transkasiLJBB',
    'supabase_transkasiMBB',
    'supabase_stockawalDDD',
    'supabase_stockawalLJBB',
    'supabase_stockawalMBB',
    'dbarticles',
    'dbstores',
    'dbbranch_ro',
  ];
  
  console.log('=== EXISTING TABLES ===\n');
  for (const table of potentialTables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (!error) {
      const columns = Object.keys(data[0] || {});
      console.log(`\n📦 ${table}`);
      console.log(`   Columns (${columns.length}): ${columns.join(', ')}`);
      if (data[0]) {
        console.log(`   Sample: ${JSON.stringify(data[0]).slice(0, 100)}...`);
      }
    }
  }
  
  console.log('\n\n=== ROW COUNTS ===\n');
  for (const table of potentialTables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (!error) {
      console.log(`${table}: ${count} rows`);
    }
  }
}

explore();
