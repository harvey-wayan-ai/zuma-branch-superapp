import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(request: Request) {
  try {
    const { roId, dnpbNumber } = await request.json();

    if (!roId || !dnpbNumber) {
      return NextResponse.json(
        { success: false, error: 'roId and dnpbNumber are required' },
        { status: 400 }
      );
    }

    const dnpbPattern = /^DNPB\/([A-Z]+)\/WHS\/\d{4}\/[IVX]+\/\d+$/;
    const match = dnpbNumber.match(dnpbPattern);
    if (!match) {
      return NextResponse.json(
        { success: false, error: 'Invalid DNPB format. Expected: DNPB/DDD/WHS/2026/I/001' },
        { status: 400 }
      );
    }

    const warehouseCode = match[1];
    const transactionTableMap: Record<string, string> = {
      'DDD': 'supabase_transaksiDDD',
      'LJBB': 'supabase_transaksiLJBB',
      'MBB': 'supabase_transaksiMBB',
      'UBB': 'supabase_transaksiUBB',
    };
    
    const transactionTable = transactionTableMap[warehouseCode];
    let dnpbMatch = false;
    
    if (transactionTable) {
      const { data: txMatch } = await supabase
        .from(transactionTable)
        .select('DNPB')
        .eq('DNPB', dnpbNumber)
        .limit(1);
      
      dnpbMatch = (txMatch && txMatch.length > 0);
    }

    const { data, error } = await supabase
      .from('ro_process')
      .update({ 
        dnpb_number: dnpbNumber,
        dnpb_match: dnpbMatch,
        updated_at: new Date().toISOString() 
      })
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
        dnpbNumber,
        dnpbMatch,
        updatedRows: data.length
      }
    });
  } catch (error: any) {
    console.error('Error updating DNPB number:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roId = searchParams.get('roId');

    if (!roId) {
      return NextResponse.json(
        { success: false, error: 'roId is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('ro_process')
      .select('dnpb_number')
      .eq('ro_id', roId)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return NextResponse.json({
      success: true,
      data: {
        roId,
        dnpbNumber: data?.dnpb_number || null
      }
    });
  } catch (error: any) {
    console.error('Error fetching DNPB number:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
