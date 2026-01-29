import { NextResponse } from 'next/server';
import { supabase, SCHEMA } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const gender = searchParams.get('gender') || 'ALL';

    // Query ro_stockwhs as the article master catalog
    // Join with ro_whs_readystock VIEW for real-time available stock
    let dbQuery = supabase
      .from('ro_stockwhs')
      .select(`
        article_code,
        article_name,
        ddd_stock,
        ljbb_stock,
        total_stock,
        ro_whs_readystock!inner(
          ddd_available,
          ljbb_available,
          total_available
        )
      `);

    // Apply search filter
    if (query) {
      dbQuery = dbQuery.or(`article_code.ilike.%${query}%,article_name.ilike.%${query}%`);
    }

    // Execute query
    const { data, error } = await dbQuery
      .order('article_code')
      .limit(50);

    if (error) {
      console.error('Error fetching articles:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Transform data to match frontend interface
    // Extract gender and series from article_code (e.g., M1AMV102 -> MEN, AIRMOVE)
    const transformedData = data?.map((article: any) => {
      const code = article.article_code;
      // Infer gender from first character: M=MEN, W=WOMEN, K=KIDS
      let inferredGender = 'OTHER';
      if (code.startsWith('M')) inferredGender = 'MEN';
      else if (code.startsWith('W')) inferredGender = 'WOMEN';
      else if (code.startsWith('K')) inferredGender = 'KIDS';
      
      // Extract series from code (characters 2-5 typically)
      const seriesMatch = code.match(/^[MWK]\d([A-Z]+)/);
      const series = seriesMatch ? seriesMatch[1] : 'UNKNOWN';

      return {
        code: article.article_code,
        name: article.article_name,
        series: series,
        gender: inferredGender,
        warehouse_stock: {
          ddd_available: article.ro_whs_readystock?.ddd_available || 0,
          ljbb_available: article.ro_whs_readystock?.ljbb_available || 0,
          total_available: article.ro_whs_readystock?.total_available || 0,
        },
      };
    }) || [];

    // Apply gender filter in memory (since we infer it from code)
    let filteredData = transformedData;
    if (gender !== 'ALL') {
      filteredData = transformedData.filter((a: any) => a.gender === gender);
    }

    return NextResponse.json({
      success: true,
      data: filteredData,
    });
  } catch (error: any) {
    console.error('Error in articles API:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
