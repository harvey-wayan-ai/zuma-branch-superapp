import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const VALID_STATUSES = [
  'QUEUE',
  'APPROVED', 
  'PICKING',
  'PICK_VERIFIED',
  'DNPB_PROCESS',
  'READY_TO_SHIP',
  'IN_DELIVERY',
  'ARRIVED',
  'COMPLETED'
];

export async function PATCH(request: Request) {
  try {
    const { roId, status } = await request.json();

    if (!roId || !status) {
      return NextResponse.json(
        { success: false, error: 'roId and status are required' },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('ro_process')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('ro_id', roId)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: `RO ${roId} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        roId,
        status,
        updatedRows: data.length
      }
    });
  } catch (error: any) {
    console.error('Error updating RO status:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
