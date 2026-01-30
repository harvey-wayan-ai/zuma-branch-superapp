import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const SPECIAL_STORES = ['Other Need', 'Wholesale', 'Consignment'];

const VALID_STORES = [
  'Zuma City Of Tomorrow Mall',
  'Zuma Galaxy Mall',
  'Zuma Icon Gresik',
  'Zuma Lippo Batu',
  'Zuma Lippo Sidoarjo',
  'Zuma Mall Olympic Garden',
  'Zuma Matos',
  'ZUMA PTC',
  'Zuma Royal Plaza',
  'Zuma Sunrise Mall',
  'Zuma Tunjungan Plaza',
];

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: { regular: VALID_STORES, special: SPECIAL_STORES },
    });
  } catch (error: any) {
    console.error('Error in stores API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
