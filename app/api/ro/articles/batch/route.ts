import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(request: Request) {
  try {
    const authClient = await createClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { roId, updates } = await request.json();

    if (!roId || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'roId and updates array are required' },
        { status: 400 }
      );
    }

    const validationErrors: string[] = [];
    for (const update of updates) {
      if (!update.articleCode || typeof update.dddBoxes !== 'number' || typeof update.ljbbBoxes !== 'number') {
        validationErrors.push(`Invalid update format for article: ${update.articleCode || 'unknown'}`);
      }
      if (update.dddBoxes < 0 || update.ljbbBoxes < 0) {
        validationErrors.push(`${update.articleCode}: Box quantities cannot be negative`);
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
      const boxesRequested = update.dddBoxes + update.ljbbBoxes;

      const { data, error } = await supabase
        .from('ro_process')
        .update({
          boxes_allocated_ddd: update.dddBoxes,
          boxes_allocated_ljbb: update.ljbbBoxes,
          boxes_requested: boxesRequested,
          updated_at: new Date().toISOString()
        })
        .eq('ro_id', roId)
        .eq('article_code', update.articleCode)
        .select();

      if (error) {
        errors.push({ articleCode: update.articleCode, error: error.message });
      } else if (!data || data.length === 0) {
        errors.push({ articleCode: update.articleCode, error: 'Article not found' });
      } else {
        results.push({ articleCode: update.articleCode, success: true });
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Some updates failed',
          failedUpdates: errors,
          successfulUpdates: results
        },
        { status: 207 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        roId,
        updatedCount: results.length,
        updates: results
      }
    });
  } catch (error: any) {
    console.error('Error in batch update:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
