import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeName = searchParams.get('store_name');

    if (!storeName) {
      return NextResponse.json(
        { success: false, error: 'store_name parameter is required' },
        { status: 400 }
      );
    }

    const { data: recs, error: recsError } = await supabase
      .from('ro_recommendations')
      .select('*')
      .eq('Store Name', storeName)
      .gt('Recommendation (box)', 0)
      .order('Tier', { ascending: true });

    if (recsError) {
      console.error('Error fetching recommendations:', recsError);
      return NextResponse.json(
        { success: false, error: recsError.message },
        { status: 500 }
      );
    }

    if (!recs || recs.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Fetch stock data from master_mutasi_whs using "Kode Artikel"
    // Join key: "Article Mix" from ro_recommendations = "Kode Artikel" from master_mutasi_whs
    const articleCodes = recs.map((r: any) => r['Article Mix']);
    const { data: stock, error: stockError } = await supabase
      .from('master_mutasi_whs')
      .select('*')
      .in('Kode Artikel', articleCodes);

    if (stockError) {
      console.error('Error fetching stock:', stockError);
    }

    const stockMap = new Map((stock || []).map((s: any) => [s['Kode Artikel'], s]));

    const transformedData = recs.map((rec: any) => {
      const stockData = stockMap.get(rec['Article Mix']);
      const tier = rec['Tier'] || 99;
      return {
        article_code: rec['Article Mix'],
        article_name: rec['Article'],
        suggested_boxes: rec['Recommendation (box)'] || 0,
        total_recommendation: rec['Total Recommendation'] || 0,
        priority: tier <= 2 ? 'urgent' : tier <= 4 ? 'normal' : 'low',
        tier: tier,
        assay_status: rec['ASSRT STATUS'],
        broken_size: rec['BROKEN SIZE'],
        warehouse_stock: {
          ddd_available: stockData?.['Stock Akhir DDD'] || 0,
          ljbb_available: stockData?.['Stock Akhir LJBB'] || 0,
          mbb_available: stockData?.['Stock Akhir MBB'] || 0,
          ubb_available: stockData?.['Stock Akhir UBB'] || 0,
          total_available: stockData?.['Stock Akhir Total'] || 0,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedData,
    });
  } catch (error: any) {
    console.error('Error in recommendations API:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
