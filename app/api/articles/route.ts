import { NextResponse } from 'next/server';
import { supabase, SCHEMA } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const gender = searchParams.get('gender') || 'ALL';

    let stockQuery = supabase.from('master_mutasi_whs').select('*');

    if (query) {
      stockQuery = stockQuery.or(`Kode Artikel.ilike.%${query}%,Nama Artikel.ilike.%${query}%`);
    }

    const { data: articles, error: articlesError } = await stockQuery
      .order('Kode Artikel')
      .limit(50);

    if (articlesError) {
      console.error('Error fetching articles:', articlesError);
      return NextResponse.json(
        { success: false, error: articlesError.message },
        { status: 500 }
      );
    }

    if (!articles || articles.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const transformedData = articles.map((article: any) => {
      const code = article['Kode Artikel'];
      
      let inferredGender = 'OTHER';
      if (code.startsWith('M')) inferredGender = 'MEN';
      else if (code.startsWith('W')) inferredGender = 'WOMEN';
      else if (code.startsWith('K')) inferredGender = 'KIDS';
      
      const seriesMatch = code.match(/^[MWK]\d([A-Z]+)/);
      const series = seriesMatch ? seriesMatch[1] : 'UNKNOWN';

      return {
        code: article['Kode Artikel'],
        name: article['Nama Artikel'],
        series: series,
        gender: inferredGender,
        warehouse_stock: {
          ddd_available: article['Stock Akhir DDD'] || 0,
          ljbb_available: article['Stock Akhir LJBB'] || 0,
          total_available: article['Stock Akhir Total'] || 0,
        },
      };
    });

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
