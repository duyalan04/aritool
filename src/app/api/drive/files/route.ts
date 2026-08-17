import { NextRequest, NextResponse } from 'next/server';
import { listFiles } from '@/lib/google-drive';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');

    if (!folderId) {
      return NextResponse.json(
        { success: false, error: 'Thiếu folderId' },
        { status: 400 }
      );
    }

    const files = await listFiles(folderId);
    return NextResponse.json({
      success: true,
      files,
    });
  } catch (error: any) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Lỗi khi tải danh sách files trong thư mục',
      },
      { status: 500 }
    );
  }
}
