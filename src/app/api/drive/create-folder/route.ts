import { NextRequest, NextResponse } from 'next/server';
import { createDriveFolder } from '@/lib/google-drive';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, parentId } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Tên thư mục không được để trống' },
        { status: 400 }
      );
    }

    const folder = await createDriveFolder(name.trim(), parentId || undefined);

    return NextResponse.json({
      success: true,
      folder,
    });
  } catch (error: any) {
    console.error('Error creating folder on Google Drive:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Lỗi khi tạo thư mục trên Google Drive',
      },
      { status: 500 }
    );
  }
}
