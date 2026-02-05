import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabase } from '@/lib/supabase';

const dnpbPattern = /^DNPB\/([A-Z]+)\/WHS\/\d{4}\/[IVX]+\/\d+$/;

const transactionTableMap: Record<string, string> = {
  'DDD': 'supabase_transaksiDDD',
  'LJBB': 'supabase_transaksiLJBB',
  'MBB': 'supabase_transaksiMBB',
  'UBB': 'supabase_transaksiUBB',
};

async function validateDNPB(dnpbNumber: string): Promise<boolean> {
  const match = dnpbNumber.match(dnpbPattern);
  if (!match) return false;
  
  const warehouseCode = match[1];
  const transactionTable = transactionTableMap[warehouseCode];
  
  if (!transactionTable) return false;
  
  const { data: txMatch } = await supabase
    .from(transactionTable)
    .select('DNPB')
    .eq('DNPB', dnpbNumber)
    .limit(1);
  
  return !!(txMatch && txMatch.length > 0);
}

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

    const { roId, dnpbNumberDDD, dnpbNumberLJBB } = await request.json();

    if (!roId) {
      return NextResponse.json(
        { success: false, error: 'roId is required' },
        { status: 400 }
      );
    }

    let dnpbMatchDDD = false;
    let dnpbMatchLJBB = false;

    if (dnpbNumberDDD) {
      if (!dnpbNumberDDD.match(dnpbPattern)) {
        return NextResponse.json(
          { success: false, error: 'Invalid DNPB DDD format. Expected: DNPB/DDD/WHS/2026/I/001' },
          { status: 400 }
        );
      }
      dnpbMatchDDD = await validateDNPB(dnpbNumberDDD);
    }

    if (dnpbNumberLJBB) {
      if (!dnpbNumberLJBB.match(dnpbPattern)) {
        return NextResponse.json(
          { success: false, error: 'Invalid DNPB LJBB format. Expected: DNPB/LJBB/WHS/2026/I/001' },
          { status: 400 }
        );
      }
      dnpbMatchLJBB = await validateDNPB(dnpbNumberLJBB);
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (dnpbNumberDDD !== undefined) {
      updateData.dnpb_number_ddd = dnpbNumberDDD;
      updateData.dnpb_match_ddd = dnpbMatchDDD;
    }

    if (dnpbNumberLJBB !== undefined) {
      updateData.dnpb_number_ljbb = dnpbNumberLJBB;
      updateData.dnpb_match_ljbb = dnpbMatchLJBB;
    }

    const { data, error } = await supabase
      .from('ro_process')
      .update(updateData)
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
        dnpbNumberDDD: dnpbNumberDDD || null,
        dnpbNumberLJBB: dnpbNumberLJBB || null,
        dnpbMatchDDD,
        dnpbMatchLJBB,
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
    const authClient = await createClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

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
      .select('dnpb_number_ddd, dnpb_number_ljbb')
      .eq('ro_id', roId)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return NextResponse.json({
      success: true,
      data: {
        roId,
        dnpbNumberDDD: data?.dnpb_number_ddd || null,
        dnpbNumberLJBB: data?.dnpb_number_ljbb || null
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
