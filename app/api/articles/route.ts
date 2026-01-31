import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    let stockQuery = supabase.schema('branch_super_app_clawdbot').from('master_mutasi_whs').select('*');

    if (query) {
      const sanitized = query
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_')
        .replace(/'/g, "''");
      stockQuery = stockQuery.or(`Kode Artikel.ilike.%${sanitized}%,Nama Artikel.ilike.%${sanitized}%`);
    }

    const { data: articles, error: articlesError } = await stockQuery
      .order('Nama Artikel')
      .limit(500);

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

    // Group by Kode Artikel and aggregate stock
    const articleMap = new Map();
    (articles || []).forEach((row: any) => {
      const code = row['Kode Artikel'];
      if (!code) return;
      
      if (!articleMap.has(code)) {
        articleMap.set(code, {
          code: code,
          name: row['Nama Artikel'],
          tipe: row['tipe'],
          gender: row['gender'],
          series: row['series'],
          ddd: 0,
          ljbb: 0,
          mbb: 0,
          ubb: 0,
          total: 0,
        });
      }
      const art = articleMap.get(code);
      art.ddd += Number(row['Stock Akhir DDD']) || 0;
      art.ljbb += Number(row['Stock Akhir LJBB']) || 0;
      art.mbb += Number(row['Stock Akhir MBB']) || 0;
      art.ubb += Number(row['Stock Akhir UBB']) || 0;
      art.total += Number(row['Stock Akhir Total']) || 0;
    });

    const transformedData = Array.from(articleMap.values()).map((article: any) => ({
      code: article.code,
      name: article.name,
      tipe: article.tipe,
      gender: article.gender,
      series: article.series,
      warehouse_stock: {
        ddd_available: article.ddd,
        ljbb_available: article.ljbb,
        mbb_available: article.mbb,
        ubb_available: article.ubb,
        total_available: article.total,
      },
    }));

    return NextResponse.json({
      success: true,
      data: transformedData,
    });
  } catch (error: any) {
    console.error('Error in articles API:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
