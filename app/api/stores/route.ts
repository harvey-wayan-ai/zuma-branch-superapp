import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const SPECIAL_STORES = ['Other Need', 'Wholesale', 'Consignment'];

export async function GET() {
  try {
    const { data, error } = await supabase.rpc('get_distinct_stores');

    if (error) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('ro_recommendations')
        .select('"Store Name"')
        .neq('Store Name', 'Store Name')
        .neq('Store Name', '')
        .limit(5000);

      if (fallbackError) throw fallbackError;

      const uniqueStores = [...new Set(fallbackData?.map((r: any) => r['Store Name']).filter(Boolean))].sort();

      return NextResponse.json({
        success: true,
        data: { regular: uniqueStores, special: SPECIAL_STORES },
      });
    }

    const stores = data?.map((r: any) => r.store_name).filter(Boolean) || [];

    return NextResponse.json({
      success: true,
      data: { regular: stores, special: SPECIAL_STORES },
    });
  } catch (error: any) {
    console.error('Error in stores API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
