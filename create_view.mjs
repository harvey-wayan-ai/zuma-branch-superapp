import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rwctwnzckyepiwcufdlw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'branch_super_app_clawdbot' }
});

const createViewSQL = `
CREATE OR REPLACE VIEW branch_super_app_clawdbot.ro_arrive_detail AS

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
`;

const addCommentSQL = `
COMMENT ON VIEW branch_super_app_clawdbot.ro_arrive_detail IS 
'Intermediary view for RO Arrive App. Expands ro_process (ARRIVED) to SIZE level.
pairs_shipped = boxes_total × pairs_per_box';
`;

async function createView() {
  console.log('Creating ro_arrive_detail VIEW...');
  
  // Execute CREATE VIEW
  const { error: createError } = await supabase.rpc('exec_sql', { 
    sql: createViewSQL 
  });
  
  if (createError) {
    console.error('Error creating view:', createError);
    
    // Try direct SQL execution via REST API
    console.log('Trying alternative method...');
    const { error: altError } = await supabase.from('_sql_query').select('*').eq('query', createViewSQL);
    
    if (altError) {
      console.error('Alternative method also failed:', altError);
      process.exit(1);
    }
  }
  
  console.log('View created successfully!');
  
  // Add comment
  const { error: commentError } = await supabase.rpc('exec_sql', { 
    sql: addCommentSQL 
  });
  
  if (commentError) {
    console.warn('Warning: Could not add comment:', commentError.message);
  } else {
    console.log('Comment added successfully!');
  }
  
  // Verify the view
  console.log('\nVerifying view...');
  const { data, error: verifyError } = await supabase
    .from('ro_arrive_detail')
    .select('*')
    .limit(5);
  
  if (verifyError) {
    console.error('Verification failed:', verifyError);
    process.exit(1);
  }
  
  console.log('✅ View verification successful!');
  console.log(`Returned ${data?.length || 0} rows`);
  if (data && data.length > 0) {
    console.log('\nSample data:');
    console.log(JSON.stringify(data[0], null, 2));
  }
}

createView().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
