import { NextRequest, NextResponse } from 'next/server';
import { getTextContent, saveTextContent } from '@/lib/google-drive';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: 'Thiếu fileId' },
        { status: 400 }
      );
    }

    const content = await getTextContent(fileId);
    return NextResponse.json({
      success: true,
      fileId,
      content,
    });
  } catch (error: any) {
    console.error('Error fetching file content:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Lỗi khi đọc nội dung file text',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileId, content } = body;

    if (!fileId || typeof content !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Thiếu fileId hoặc nội dung content' },
        { status: 400 }
      );
    }

    const result = await saveTextContent(fileId, content);
    return NextResponse.json({
      success: true,
      fileId,
      modifiedTime: result.modifiedTime,
      message: 'Lưu nội dung file thành công!',
    });
  } catch (error: any) {
    console.error('Error saving file content:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Lỗi khi lưu nội dung file lên Google Drive',
      },
      { status: 500 }
    );
  }
}
