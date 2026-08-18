import { NextRequest, NextResponse } from 'next/server';
import { updateFolderPresence } from '@/lib/google-drive';

interface ViewerSession {
  deviceId: string;
  deviceName: string;
  folderId: string;
  batchId?: string;
  lastSeen: number;
}

// In-memory presence store (for instant local response)
declare global {
  // eslint-disable-next-line no-var
  var __ariPresenceStore: Map<string, ViewerSession> | undefined;
}

if (!global.__ariPresenceStore) {
  global.__ariPresenceStore = new Map<string, ViewerSession>();
}

const presenceStore = global.__ariPresenceStore;

// Keep presence active for up to 4 hours (14,400,000 ms) so tab switching won't drop it
function cleanupStaleSessions() {
  const now = Date.now();
  presenceStore.forEach((session, key) => {
    if (now - session.lastSeen > 14400000) {
      if (session.folderId) {
        updateFolderPresence(session.folderId, '', '', 'leave').catch(() => {});
      }
      presenceStore.delete(key);
    }
  });
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    cleanupStaleSessions();

    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');

    const activeFolders: Record<string, { deviceId: string; deviceName: string; lastSeen: number }[]> = {};

    presenceStore.forEach((session) => {
      if (batchId && session.batchId && session.batchId !== batchId) {
        return;
      }

      if (!activeFolders[session.folderId]) {
        activeFolders[session.folderId] = [];
      }

      activeFolders[session.folderId].push({
        deviceId: session.deviceId,
        deviceName: session.deviceName,
        lastSeen: session.lastSeen,
      });
    });

    return NextResponse.json({
      success: true,
      activeFolders,
      totalActiveUsers: presenceStore.size,
    });
  } catch (error: any) {
    console.error('Presence GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi lấy trạng thái online' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, deviceName, folderId, batchId, action, previousFolderId } = body;

    if (!deviceId) {
      return NextResponse.json({ success: false, error: 'Thiếu deviceId' }, { status: 400 });
    }

    const sessionKey = `${deviceId}`;
    const name = deviceName || `Máy ${deviceId.slice(0, 4)}`;

    // Clean previous folder on Drive if switched to a different folder
    if (previousFolderId && previousFolderId !== folderId) {
      updateFolderPresence(previousFolderId, '', '', 'leave').catch(() => {});
    }

    if (action === 'leave' || !folderId) {
      const existing = presenceStore.get(sessionKey);
      if (existing?.folderId) {
        updateFolderPresence(existing.folderId, '', '', 'leave').catch(() => {});
      }
      presenceStore.delete(sessionKey);
      cleanupStaleSessions();
      return NextResponse.json({ success: true, message: 'Left session' });
    }

    // Update in-memory session
    presenceStore.set(sessionKey, {
      deviceId,
      deviceName: name,
      folderId,
      batchId,
      lastSeen: Date.now(),
    });

    // Update Google Drive folder properties asynchronously
    updateFolderPresence(folderId, name, deviceId, 'heartbeat').catch((err) => {
      console.warn('Drive presence sync note:', err.message);
    });

    cleanupStaleSessions();

    const activeFolders: Record<string, { deviceId: string; deviceName: string; lastSeen: number }[]> = {};
    presenceStore.forEach((session) => {
      if (!activeFolders[session.folderId]) {
        activeFolders[session.folderId] = [];
      }
      activeFolders[session.folderId].push({
        deviceId: session.deviceId,
        deviceName: session.deviceName,
        lastSeen: session.lastSeen,
      });
    });

    return NextResponse.json({
      success: true,
      activeFolders,
      totalActiveUsers: presenceStore.size,
    });
  } catch (error: any) {
    console.error('Presence POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi cập nhật presence' },
      { status: 500 }
    );
  }
}
