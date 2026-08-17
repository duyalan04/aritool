import { NextResponse } from 'next/server';
import { checkConnection } from '@/lib/google-drive';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = await checkConnection();
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json(
      {
        connected: false,
        mode: 'unknown',
        error: error.message || 'Lỗi kiểm tra kết nối Google Drive',
      },
      { status: 500 }
    );
  }
}
