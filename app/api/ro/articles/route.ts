import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(request: Request) {
  try {
    const { roId, articleCode, dddBoxes, ljbbBoxes } = await request.json();

    if (!roId || !articleCode) {
      return NextResponse.json(
        { success: false, error: 'roId and articleCode are required' },
        { status: 400 }
      );
    }

    if (dddBoxes < 0 || ljbbBoxes < 0) {
      return NextResponse.json(
        { success: false, error: 'Box quantities cannot be negative' },
        { status: 400 }
      );
    }

    const boxesRequested = (dddBoxes || 0) + (ljbbBoxes || 0);

    const { data, error } = await supabase
      .from('ro_process')
      .update({ 
        boxes_allocated_ddd: dddBoxes || 0,
        boxes_allocated_ljbb: ljbbBoxes || 0,
        boxes_requested: boxesRequested,
        updated_at: new Date().toISOString() 
      })
      .eq('ro_id', roId)
      .eq('article_code', articleCode)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: `Article ${articleCode} not found in RO ${roId}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        roId,
        articleCode,
        dddBoxes,
        ljbbBoxes,
        boxesRequested
      }
    });
  } catch (error: any) {
    console.error('Error updating article quantities:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
