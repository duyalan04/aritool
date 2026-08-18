import { NextRequest, NextResponse } from 'next/server';

interface ViewerSession {
  deviceId: string;
  deviceName: string;
  folderId: string;
  batchId?: string;
  lastSeen: number;
}

// In-memory presence store (persists across requests in runtime)
// Key: deviceId -> ViewerSession
declare global {
  // eslint-disable-next-line no-var
  var __ariPresenceStore: Map<string, ViewerSession> | undefined;
}

if (!global.__ariPresenceStore) {
  global.__ariPresenceStore = new Map<string, ViewerSession>();
}

const presenceStore = global.__ariPresenceStore;

// Clean up stale sessions (older than 10 seconds) using forEach
function cleanupStaleSessions() {
  const now = Date.now();
  presenceStore.forEach((session, key) => {
    if (now - session.lastSeen > 10000) {
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

    // Group active viewers by folderId
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
    const { deviceId, deviceName, folderId, batchId, action } = body;

    if (!deviceId) {
      return NextResponse.json({ success: false, error: 'Thiếu deviceId' }, { status: 400 });
    }

    const sessionKey = `${deviceId}`;

    if (action === 'leave' || !folderId) {
      presenceStore.delete(sessionKey);
      cleanupStaleSessions();
      return NextResponse.json({ success: true, message: 'Left session' });
    }

    // Update session heartbeat
    presenceStore.set(sessionKey, {
      deviceId,
      deviceName: deviceName || `Máy ${deviceId.slice(0, 4)}`,
      folderId,
      batchId,
      lastSeen: Date.now(),
    });

    cleanupStaleSessions();

    // Return current active folders
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
