import { NextRequest, NextResponse } from 'next/server';
import { listSubfolders } from '@/lib/google-drive';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');

    if (!batchId) {
      return NextResponse.json(
        { success: false, error: 'Thiếu batchId' },
        { status: 400 }
      );
    }

    const subfolders = await listSubfolders(batchId);
    return NextResponse.json({
      success: true,
      subfolders,
    });
  } catch (error: any) {
    console.error('Error fetching subfolders:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Lỗi khi tải danh sách bộ con',
      },
      { status: 500 }
    );
  }
}
