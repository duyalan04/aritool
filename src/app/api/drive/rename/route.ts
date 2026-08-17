import { NextRequest, NextResponse } from 'next/server';
import { renameFolder } from '@/lib/google-drive';
import { FolderStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { folderId, status, customName } = body;

    if (!folderId) {
      return NextResponse.json(
        { success: false, error: 'Thiếu folderId' },
        { status: 400 }
      );
    }

    const targetStatus: FolderStatus = status || 'NONE';
    const result = await renameFolder(folderId, targetStatus, customName);

    return NextResponse.json({
      ...result,
      message: `Đã cập nhật trạng thái folder: ${result.newName}`,
    });
  } catch (error: any) {
    console.error('Error renaming folder:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Lỗi khi đổi tên thư mục trên Google Drive',
      },
      { status: 500 }
    );
  }
}
