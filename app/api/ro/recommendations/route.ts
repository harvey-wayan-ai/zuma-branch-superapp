import { NextResponse } from 'next/server';
import { supabase, SCHEMA } from '@/lib/supabase';

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

    // Fetch recommendations for the store
    // Join with ro_whs_readystock to get real-time available stock
    const { data, error } = await supabase
      .from('ro_recommendations')
      .select(`
        store_name,
        article_mix,
        gender,
        series,
        article,
        tier,
        total_recommendation,
        recommendation_box,
        assay_status,
        ro_whs_readystock!inner(
          ddd_available,
          ljbb_available,
          total_available
        )
      `)
      .eq('store_name', storeName)
      .order('tier', { ascending: true });

    if (error) {
      console.error('Error fetching recommendations:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Transform data to match frontend interface
    const transformedData = data?.map((rec: any) => ({
      article_code: rec.article_mix,
      article_name: rec.article,
      suggested_boxes: rec.recommendation_box,
      total_recommendation: rec.total_recommendation,
      priority: rec.tier <= 2 ? 'urgent' : rec.tier <= 4 ? 'normal' : 'low',
      tier: rec.tier,
      assay_status: rec.assay_status,
      warehouse_stock: {
        ddd_available: rec.ro_whs_readystock?.ddd_available || 0,
        ljbb_available: rec.ro_whs_readystock?.ljbb_available || 0,
        total_available: rec.ro_whs_readystock?.total_available || 0,
      },
    })) || [];

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
