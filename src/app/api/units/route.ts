import { NextResponse } from 'next/server';
import { getUnits } from '@/lib/db';

export async function GET() {
  try {
    const units = await getUnits();
    return NextResponse.json({ success: true, data: units });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data unit: ' + error.message },
      { status: 500 }
    );
  }
}
