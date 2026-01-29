import { NextResponse } from 'next/server';

// Static store list for Jatim Area (matches current RequestForm.tsx)
// In production, this should come from Supabase stores table
const REGULAR_STORES = [
  'Zuma Tunjungan Plaza',
  'Zuma Royal Plaza',
  'Zuma Bintaro Xchange',
  'Zuma Galaxy Mall',
  'Zuma Ciputra World',
];

const SPECIAL_STORES = [
  'Other Need',
  'Wholesale',
  'Consignment',
];

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        regular: REGULAR_STORES,
        special: SPECIAL_STORES,
      },
    });
  } catch (error: any) {
    console.error('Error in stores API:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
