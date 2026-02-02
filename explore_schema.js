const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rwctwnzckyepiwcufdlw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Y3R3bnpja3llcGl3Y3VmZGx3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU3MDI5MywiZXhwIjoyMDc1MTQ2MjkzfQ.0amj_ztVNgHZdU-LAfk-QvDQATGy-dVezEg6HYHLrec',
  { db: { schema: 'branch_super_app_clawdbot' } }
);

async function exploreSchema() {
  const { data: tables, error } = await supabase
    .from('information_schema.tables')
    .select('table_name, table_type')
    .eq('table_schema', 'branch_super_app_clawdbot')
    .order('table_name');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('=== TABLES AND VIEWS ===');
  console.log(`Total: ${tables.length}`);
  
  const baseTables = tables.filter(t => t.table_type === 'BASE TABLE');
  const views = tables.filter(t => t.table_type === 'VIEW');
  
  console.log(`\nBASE TABLES (${baseTables.length}):`);
  baseTables.forEach(t => console.log(`  ${t.table_name}`));
  
  console.log(`\nVIEWS (${views.length}):`);
  views.forEach(t => console.log(`  ${t.table_name}`));
}

exploreSchema();
