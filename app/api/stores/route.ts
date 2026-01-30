import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SPECIAL_STORES = ['Other Need', 'Wholesale', 'Consignment'];

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { db: { schema: 'branch_super_app_clawdbot' } }
    );

    const allStores = new Set<string>();
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('ro_recommendations')
        .select('"Store Name"')
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) throw error;
      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        data.forEach((r: any) => {
          const name = r['Store Name'];
          if (name && name !== 'Store Name') allStores.add(name);
        });
        if (data.length < pageSize) hasMore = false;
        page++;
      }
    }

    const stores = Array.from(allStores).sort();

    return NextResponse.json({
      success: true,
      data: { regular: stores, special: SPECIAL_STORES },
    });
  } catch (error: any) {
    console.error('Error in stores API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
