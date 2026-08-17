import { NextRequest, NextResponse } from 'next/server';
import { uploadDriveFile } from '@/lib/google-drive';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const folderId = formData.get('folderId') as string;
    const file = formData.get('file') as File;
    const customName = (formData.get('fileName') as string) || (file ? file.name : '');

    if (!folderId) {
      return NextResponse.json(
        { success: false, error: 'Thiếu folderId' },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy file' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || 'application/octet-stream';
    const fileName = customName || file.name || 'file';

    const uploaded = await uploadDriveFile(folderId, fileName, mimeType, buffer);

    return NextResponse.json({
      success: true,
      file: uploaded,
    });
  } catch (error: any) {
    console.error('Error uploading file to Google Drive:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Lỗi khi tải file lên Google Drive',
      },
      { status: 500 }
    );
  }
}
