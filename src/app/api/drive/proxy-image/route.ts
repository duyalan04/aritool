import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getDriveConfig } from '@/lib/google-drive';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return new NextResponse('Thiếu fileId', { status: 400 });
    }

    const config = getDriveConfig();

    if (!config.hasCredentials) {
      // Mock mode: redirect to placeholder or return empty
      return NextResponse.json({ message: 'Mock mode proxy' });
    }

    let auth;
    if (config.serviceAccountKey) {
      let keyObj = JSON.parse(
        config.serviceAccountKey.startsWith('{')
          ? config.serviceAccountKey
          : Buffer.from(config.serviceAccountKey, 'base64').toString('utf-8')
      );
      auth = new google.auth.JWT({
        email: keyObj.client_email,
        key: keyObj.private_key,
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
      });
    } else if (config.clientEmail && config.privateKey) {
      auth = new google.auth.JWT({
        email: config.clientEmail,
        key: config.privateKey,
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
      });
    }

    if (!auth) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const drive = google.drive({ version: 'v3', auth });

    // Get metadata for mimeType
    const meta = await drive.files.get({
      fileId,
      fields: 'mimeType, name, size',
      supportsAllDrives: true,
    });

    const mimeType = meta.data.mimeType || 'image/jpeg';

    // Get binary stream
    const fileStream = await drive.files.get(
      {
        fileId,
        alt: 'media',
        supportsAllDrives: true,
      },
      { responseType: 'arraybuffer' }
    );

    return new NextResponse(Buffer.from(fileStream.data as ArrayBuffer), {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'Content-Disposition': `inline; filename="${meta.data.name || 'image'}"`,
      },
    });
  } catch (error: any) {
    console.error('Error proxying image:', error);
    return new NextResponse('Error loading image', { status: 500 });
  }
}
