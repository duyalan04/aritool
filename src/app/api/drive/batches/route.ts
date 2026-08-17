import { NextRequest, NextResponse } from 'next/server';
import { listBatchFolders } from '@/lib/google-drive';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId') || undefined;

    const batches = await listBatchFolders(parentId);
    return NextResponse.json({
      success: true,
      batches,
    });
  } catch (error: any) {
    console.error('Error fetching batches:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Lỗi khi tải danh sách thư mục bộ',
      },
      { status: 500 }
    );
  }
}
