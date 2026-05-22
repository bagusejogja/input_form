import { NextResponse } from 'next/server';
import { getAppSettings } from '@/lib/db';

export async function GET() {
  try {
    const settings = await getAppSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil pengaturan: ' + error.message },
      { status: 500 }
    );
  }
}
