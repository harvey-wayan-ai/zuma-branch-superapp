import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const SPECIAL_STORES = ['Other Need', 'Wholesale', 'Consignment'];

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('ro_recommendations')
      .select('"Store Name"')
      .neq('Store Name', 'Store Name')  // exclude header row
      .neq('Store Name', '')  // exclude empty
      .order('Store Name');

    if (error) throw error;

    // Get unique store names
    const uniqueStores = [...new Set(data?.map((r: any) => r['Store Name']).filter(Boolean))];

    return NextResponse.json({
      success: true,
      data: {
        regular: uniqueStores,
        special: SPECIAL_STORES,
      },
    });
  } catch (error: any) {
    console.error('Error in stores API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
