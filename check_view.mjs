import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rwctwnzckyepiwcufdlw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'branch_super_app_clawdbot' }
});

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  // Test basic connection
  const { data: testData, error: testError } = await supabase
    .from('ro_process')
    .select('count')
    .limit(1);
  
  if (testError) {
    console.error('Connection test failed:', testError);
    return;
  }
  
  console.log('✅ Connection successful!');
  
  // Check if view exists
  console.log('\nChecking if ro_arrive_detail view exists...');
  const { data: viewData, error: viewError } = await supabase
    .from('ro_arrive_detail')
    .select('*')
    .limit(1);
  
  if (viewError) {
    console.log('View does not exist or error:', viewError.message);
    console.log('\n⚠️  You need to create the view manually in Supabase SQL Editor.');
    console.log('\n=== SQL TO EXECUTE ===\n');
    console.log(`CREATE OR REPLACE VIEW branch_super_app_clawdbot.ro_arrive_detail AS

WITH latest_kodemix AS (
    SELECT 
        kode,
        "Kode Mix Size" AS sku_code,
        ukuran,
        nama_barang,
        count_by_assortment,
        "VERSION"
    FROM (
        SELECT 
            kode,
            "Kode Mix Size",
            ukuran,
            nama_barang,
            count_by_assortment,
            "VERSION",
            ROW_NUMBER() OVER (
                PARTITION BY kode, ukuran 
                ORDER BY "VERSION" DESC NULLS LAST
            ) AS rn
        FROM public.portal_kodemix
        WHERE kode IS NOT NULL
          AND ukuran IS NOT NULL
          AND count_by_assortment IS NOT NULL
    ) ranked
    WHERE rn = 1
)

SELECT 
    rp.ro_id,
    rp.store_name,
    rp.dnpb_number,
    rp.created_at,
    rp.updated_at,
    rp.article_code,
    COALESCE(pk.nama_barang, rp.article_name) AS article_name,
    pk.sku_code,
    pk.ukuran AS size,
    pk.count_by_assortment AS pairs_per_box,
    rp.boxes_allocated_ddd AS boxes_ddd,
    rp.boxes_allocated_ljbb AS boxes_ljbb,
    (rp.boxes_allocated_ddd + rp.boxes_allocated_ljbb) AS boxes_total,
    (rp.boxes_allocated_ddd + rp.boxes_allocated_ljbb) * pk.count_by_assortment AS pairs_shipped,
    (rp.boxes_allocated_ddd + rp.boxes_allocated_ljbb) * pk.count_by_assortment AS fisik,
    0 AS selisih

FROM branch_super_app_clawdbot.ro_process rp
JOIN latest_kodemix pk ON rp.article_code = pk.kode
WHERE rp.status = 'ARRIVED';

COMMENT ON VIEW branch_super_app_clawdbot.ro_arrive_detail IS 
'Intermediary view for RO Arrive App. Expands ro_process (ARRIVED) to SIZE level.
pairs_shipped = boxes_total × pairs_per_box';`);
    console.log('\n=== END SQL ===\n');
    console.log('Go to: https://supabase.com/dashboard/project/rwctwnzckyepiwcufdlw/sql');
    console.log('Paste the SQL above and click Run.');
  } else {
    console.log('✅ View exists and returns data!');
    console.log('Sample row:', JSON.stringify(viewData[0], null, 2));
  }
}

testConnection().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
