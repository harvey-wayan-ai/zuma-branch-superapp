import { NextResponse } from 'next/server';
import { supabase, SCHEMA } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
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

    // Validate stock availability for each article
    const validationErrors = [];
    for (const article of articles) {
      if (article.boxes > article.warehouse_stock?.total_available) {
        validationErrors.push(
          `Only ${article.warehouse_stock?.total_available} boxes available for ${article.code}. Please reduce quantity.`
        );
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: validationErrors.join('\n') },
        { status: 400 }
      );
    }

    // Generate RO ID: RO-YYMM-XXXX
    const now = new Date();
    const yearMonth = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `RO-${yearMonth}-`;

    // Get last RO number for this month
    const { data: lastRO } = await supabase
      .from('ro_process')
      .select('ro_id')
      .like('ro_id', `${prefix}%`)
      .order('ro_id', { ascending: false })
      .limit(1);

    let nextNum = 1;
    if (lastRO && lastRO.length > 0 && lastRO[0].ro_id) {
      const lastNum = parseInt(lastRO[0].ro_id.split('-')[2], 10);
      nextNum = lastNum + 1;
    }
    const roId = `${prefix}${String(nextNum).padStart(4, '0')}`;

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



    return NextResponse.json({
      success: true,
      data: {
        ro_id: roId,
        store_name,
        articles_count: articles.length,
        total_boxes: articles.reduce((sum: number, a: any) => sum + a.boxes, 0),
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
