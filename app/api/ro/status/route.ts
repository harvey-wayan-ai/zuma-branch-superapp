import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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
  'COMPLETED',
  'CANCELLED'
];

const VALID_TRANSITIONS: Record<string, string[]> = {
  'QUEUE': ['APPROVED', 'CANCELLED'],
  'APPROVED': ['PICKING', 'CANCELLED'],
  'PICKING': ['PICK_VERIFIED', 'CANCELLED'],
  'PICK_VERIFIED': ['DNPB_PROCESS', 'CANCELLED'],
  'DNPB_PROCESS': ['READY_TO_SHIP', 'CANCELLED'],
  'READY_TO_SHIP': ['IN_DELIVERY', 'CANCELLED'],
  'IN_DELIVERY': ['ARRIVED', 'CANCELLED'],
  'ARRIVED': ['COMPLETED', 'CANCELLED'],
  'COMPLETED': [],
  'CANCELLED': [],
};

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

    const { data: currentData, error: fetchError } = await supabase
      .from('ro_process')
      .select('status')
      .eq('ro_id', roId)
      .limit(1);

    if (fetchError) throw fetchError;

    if (!currentData || currentData.length === 0) {
      return NextResponse.json(
        { success: false, error: `RO ${roId} not found` },
        { status: 404 }
      );
    }

    const currentStatus = currentData[0].status;
    const allowedNextStatuses = VALID_TRANSITIONS[currentStatus] || [];
    
    if (!allowedNextStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Cannot transition from ${currentStatus} to ${status}. Allowed: ${allowedNextStatuses.join(', ') || 'none'}` },
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
