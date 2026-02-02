const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rwctwnzckyepiwcufdlw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Y3R3bnpja3llcGl3Y3VmZGx3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU3MDI5MywiZXhwIjoyMDc1MTQ2MjkzfQ.0amj_ztVNgHZdU-LAfk-QvDQATGy-dVezEg6HYHLrec',
  { db: { schema: 'branch_super_app_clawdbot' } }
);

async function exploreMore() {
  const moreTables = [
    'supabase_salesdata',
    'supabase_articledata',
    'supabase_storedata',
    'dbjoin_sales_articles_stores',
    'supabase_transkasiUBB',
    'supabase_stockawalUBB',
  ];
  
  console.log('=== ADDITIONAL TABLES ===\n');
  for (const table of moreTables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (!error) {
      const columns = Object.keys(data[0] || {});
      console.log(`\n📦 ${table}`);
      console.log(`   Columns (${columns.length}): ${columns.join(', ')}`);
    } else {
      console.log(`\n❌ ${table}: ${error.message}`);
    }
  }
}

exploreMore();
