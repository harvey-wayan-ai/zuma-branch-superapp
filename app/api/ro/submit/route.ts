import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabase, SCHEMA } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const authClient = await createClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { store_name, articles, notes } = body;

    // Validation
    if (!store_name) {
      return NextResponse.json(
        { success: false, error: 'Store name is required' },
        { status: 400 }
      );
    }

    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one article is required' },
        { status: 400 }
      );
    }

    const articleCodes = articles.map((a: any) => a.code);
    const { data: stockData, error: stockError } = await supabase
      .from('master_mutasi_whs')
      .select('"Kode Artikel", "Stock Akhir DDD", "Stock Akhir LJBB", "Stock Akhir Total"')
      .in('Kode Artikel', articleCodes);

    if (stockError) {
      console.error('Error fetching stock:', stockError);
      return NextResponse.json(
        { success: false, error: 'Failed to validate stock availability' },
        { status: 500 }
      );
    }

    const stockMap = new Map(
      (stockData || []).map((s: any) => [s['Kode Artikel'], {
        ddd: Number(s['Stock Akhir DDD']) || 0,
        ljbb: Number(s['Stock Akhir LJBB']) || 0,
        total: Number(s['Stock Akhir Total']) || 0,
      }])
    );

    const validationErrors: string[] = [];
    for (const article of articles) {
      const stock = stockMap.get(article.code);
      const requestedDdd = article.boxes_ddd || 0;
      const requestedLjbb = article.boxes_ljbb || 0;
      const totalRequested = article.boxes || (requestedDdd + requestedLjbb);
      
      if (!stock) {
        validationErrors.push(`Article ${article.code} not found in stock database.`);
        continue;
      }
      
      if (requestedDdd > stock.ddd) {
        validationErrors.push(`DDD: Only ${stock.ddd} available for ${article.code}, requested ${requestedDdd}.`);
      }
      if (requestedLjbb > stock.ljbb) {
        validationErrors.push(`LJBB: Only ${stock.ljbb} available for ${article.code}, requested ${requestedLjbb}.`);
      }
      if (totalRequested > stock.total) {
        validationErrors.push(`Total: Only ${stock.total} available for ${article.code}, requested ${totalRequested}.`);
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: validationErrors.join('\n') },
        { status: 400 }
      );
    }

    const { data: roIdResult, error: roIdError } = await supabase
      .rpc('generate_ro_id');
    
    if (roIdError || !roIdResult) {
      console.error('Error generating RO ID:', roIdError);
      return NextResponse.json(
        { success: false, error: 'Failed to generate RO ID' },
        { status: 500 }
      );
    }
    
    const roId = roIdResult as string;

    const insertData = articles.map((article: any) => ({
      ro_id: roId,
      article_code: article.code,
      article_name: article.name,
      boxes_requested: article.boxes 
        ? article.boxes // Backward compatibility: old format
        : (article.boxes_ddd || 0) + (article.boxes_ljbb || 0) + (article.boxes_mbb || 0) + (article.boxes_ubb || 0),
      boxes_allocated_ddd: article.boxes_ddd || 0,
      boxes_allocated_ljbb: article.boxes_ljbb || 0,
      boxes_allocated_mbb: article.boxes_mbb || 0,
      boxes_allocated_ubb: article.boxes_ubb || 0,
      status: 'QUEUE',
      store_name: store_name,
      notes: notes || null,
    }));

    const { data, error } = await supabase
      .from('ro_process')
      .insert(insertData)
      .select('*');

    if (error) {
      console.error('Error inserting RO:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }



    const totalBoxes = articles.reduce((sum: number, a: any) => {
      if (a.boxes) return sum + a.boxes;
      return sum + (a.boxes_ddd || 0) + (a.boxes_ljbb || 0) + (a.boxes_mbb || 0) + (a.boxes_ubb || 0);
    }, 0);

    return NextResponse.json({
      success: true,
      data: {
        ro_id: roId,
        store_name,
        articles_count: articles.length,
        total_boxes: totalBoxes,
        status: 'QUEUE',
      },
    });
  } catch (error: any) {
    console.error('Error in submit RO API:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
