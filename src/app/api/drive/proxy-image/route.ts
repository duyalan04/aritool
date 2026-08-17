import { NextRequest, NextResponse } from 'next/server';
import { getDriveClient } from '@/lib/google-drive';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return new NextResponse('Thiếu fileId', { status: 400 });
    }

    const drive = getDriveClient();

    if (!drive) {
      return new NextResponse('Chưa cấu hình Google Drive', { status: 401 });
    }

    // Get metadata and binary data in parallel
    const [meta, fileData] = await Promise.all([
      drive.files.get({
        fileId,
        fields: 'mimeType, name, size',
        supportsAllDrives: true,
      }),
      drive.files.get(
        {
          fileId,
          alt: 'media',
          supportsAllDrives: true,
        },
        { responseType: 'arraybuffer' }
      ),
    ]);

    const mimeType = meta.data.mimeType || 'image/png';
    const buffer = Buffer.from(fileData.data as ArrayBuffer);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'Content-Disposition': `inline; filename="${encodeURIComponent(meta.data.name || 'image')}"`,
      },
    });
  } catch (error: any) {
    console.error('Error proxying image from Google Drive:', error);
    return new NextResponse('Error loading image', { status: 500 });
  }
}
