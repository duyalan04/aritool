import { google } from 'googleapis';
import { parseFolderStatus, getNewFolderName } from './status-helper';
import { DriveFolder, DriveFile, FolderStatus, DriveConnectionStatus } from './types';

import fs from 'fs';
import path from 'path';

// Determine if real Google Drive credentials are configured
export function getDriveConfig() {
  let serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  let clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || '1QjVV2u_aiNPriykD1ixD1_h77sb7wUPh';

  // Fallback to local JSON key file if env is not populated
  if (!serviceAccountKey && (!clientEmail || !privateKey)) {
    try {
      const rootDir = process.cwd();
      const files = fs.readdirSync(rootDir);
      const jsonKeyFile = files.find((f) => f.endsWith('.json') && (f.includes('arctic') || f.includes('service_account') || f.includes('key')));
      if (jsonKeyFile) {
        const fileContent = fs.readFileSync(path.join(rootDir, jsonKeyFile), 'utf-8');
        const parsed = JSON.parse(fileContent);
        if (parsed.type === 'service_account' && parsed.private_key && parsed.client_email) {
          serviceAccountKey = fileContent;
          clientEmail = parsed.client_email;
          privateKey = parsed.private_key;
        }
      }
    } catch {
      // ignore
    }
  }

  const hasCredentials = Boolean(
    serviceAccountKey || (clientEmail && privateKey)
  );

  return {
    hasCredentials,
    serviceAccountKey,
    clientEmail,
    privateKey,
    rootFolderId,
  };
}

/**
 * Initializes authenticated Google Drive API client
 */
export function getDriveClient() {
  const config = getDriveConfig();

  if (!config.hasCredentials) {
    return null;
  }

  try {
    let auth;

    if (config.serviceAccountKey) {
      let keyObj: any;
      if (config.serviceAccountKey.startsWith('{')) {
        keyObj = JSON.parse(config.serviceAccountKey);
      } else {
        try {
          const decoded = Buffer.from(config.serviceAccountKey, 'base64').toString('utf-8');
          keyObj = JSON.parse(decoded);
        } catch {
          keyObj = JSON.parse(config.serviceAccountKey);
        }
      }

      auth = new google.auth.JWT({
        email: keyObj.client_email,
        key: keyObj.private_key,
        scopes: [
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/drive.file',
        ],
      });
    } else if (config.clientEmail && config.privateKey) {
      auth = new google.auth.JWT({
        email: config.clientEmail,
        key: config.privateKey,
        scopes: [
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/drive.file',
        ],
      });
    }

    if (!auth) return null;

    return google.drive({ version: 'v3', auth });
  } catch (error) {
    console.error('Error initializing Google Drive client:', error);
    return null;
  }
}

/**
 * Check Google Drive connection status
 */
export async function checkConnection(): Promise<DriveConnectionStatus> {
  const config = getDriveConfig();
  const drive = getDriveClient();

  if (!drive || !config.hasCredentials) {
    return {
      connected: false,
      mode: 'service_account',
      rootFolderName: 'Chưa kết nối',
      rootFolderId: config.rootFolderId,
      error: 'Chưa cấu hình GOOGLE_SERVICE_ACCOUNT_KEY trong file .env.local hoặc Vercel Environment Variables',
    };
  }

  try {
    const res = await drive.files.get({
      fileId: config.rootFolderId === 'root' ? 'root' : config.rootFolderId,
      fields: 'id, name',
      supportsAllDrives: true,
    });

    return {
      connected: true,
      mode: 'service_account',
      rootFolderName: res.data.name || 'ARI',
      rootFolderId: res.data.id || config.rootFolderId,
      accountEmail: config.clientEmail,
    };
  } catch (error: any) {
    return {
      connected: false,
      mode: 'service_account',
      rootFolderName: 'Unknown',
      rootFolderId: config.rootFolderId,
      error: error?.message || 'Không thể kết nối đến thư mục Google Drive. Vui lòng kiểm tra quyền chia sẻ với Service Account.',
    };
  }
}

/**
 * List batch folders inside ARI (e.g. "30 bộ lee")
 */
export async function listBatchFolders(parentFolderId?: string): Promise<DriveFolder[]> {
  const drive = getDriveClient();
  const config = getDriveConfig();

  if (!drive) {
    return [];
  }

  const parentId = parentFolderId || config.rootFolderId;
  const query = `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;

  const res = await drive.files.list({
    q: query,
    fields: 'files(id, name, modifiedTime, createdTime)',
    orderBy: 'name',
    pageSize: 100,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const files = res.data.files || [];
  return files.map((file) => {
    const { cleanName, status } = parseFolderStatus(file.name || '');
    return {
      id: file.id!,
      name: file.name || '',
      cleanName,
      status,
      parentId,
      modifiedTime: file.modifiedTime || undefined,
    };
  });
}

/**
 * List subfolders inside a batch (e.g., inside "30 bộ lee" -> "VANESSA PADILLA", etc.)
 */
export async function listSubfolders(batchFolderId: string): Promise<DriveFolder[]> {
  const drive = getDriveClient();

  if (!drive) {
    return [];
  }

  const query = `'${batchFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;

  const res = await drive.files.list({
    q: query,
    fields: 'files(id, name, modifiedTime, createdTime)',
    orderBy: 'name',
    pageSize: 200,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const files = res.data.files || [];
  return files.map((file) => {
    const { cleanName, status } = parseFolderStatus(file.name || '');
    return {
      id: file.id!,
      name: file.name || '',
      cleanName,
      status,
      parentId: batchFolderId,
      modifiedTime: file.modifiedTime || undefined,
    };
  });
}

/**
 * List files inside a subfolder (.txt, images, etc.)
 */
export async function listFiles(subfolderId: string): Promise<DriveFile[]> {
  const drive = getDriveClient();

  if (!drive) {
    return [];
  }

  const query = `'${subfolderId}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`;

  const res = await drive.files.list({
    q: query,
    fields: 'files(id, name, mimeType, size, modifiedTime, thumbnailLink, webContentLink, webViewLink)',
    orderBy: 'name',
    pageSize: 100,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const files = res.data.files || [];
  return files.map((file) => {
    const mimeType = file.mimeType || '';
    const name = file.name || '';
    const isImage = mimeType.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(name);
    const isText = mimeType.startsWith('text/') || /\.(txt|json|md|csv|log)$/i.test(name);

    return {
      id: file.id!,
      name,
      mimeType,
      size: file.size ? Number(file.size) : undefined,
      modifiedTime: file.modifiedTime || undefined,
      thumbnailLink: file.thumbnailLink || `/api/drive/proxy-image?fileId=${file.id}`,
      webContentLink: file.webContentLink || `/api/drive/proxy-image?fileId=${file.id}`,
      webViewLink: file.webViewLink || undefined,
      isImage,
      isText,
    };
  });
}

/**
 * Fetch raw text content of a text file from Google Drive
 */
export async function getTextContent(fileId: string): Promise<string> {
  const drive = getDriveClient();

  if (!drive) {
    return '';
  }

  const res = await drive.files.get(
    {
      fileId,
      alt: 'media',
      supportsAllDrives: true,
    },
    { responseType: 'text' }
  );

  return typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
}

/**
 * Save / Update text content to Google Drive
 */
export async function saveTextContent(fileId: string, content: string): Promise<{ success: boolean; modifiedTime: string }> {
  const drive = getDriveClient();
  const now = new Date().toISOString();

  if (!drive) {
    throw new Error('Chưa kết nối Google Drive');
  }

  const res = await drive.files.update({
    fileId,
    media: {
      mimeType: 'text/plain; charset=utf-8',
      body: content,
    },
    fields: 'id, modifiedTime',
    supportsAllDrives: true,
  });

  return {
    success: true,
    modifiedTime: res.data.modifiedTime || now,
  };
}

/**
 * Rename a folder on Google Drive (e.g. add _OK, _2_3_DAY, _KO or revert to clean name)
 */
export async function renameFolder(folderId: string, targetStatus: FolderStatus, customName?: string): Promise<{
  success: boolean;
  oldName: string;
  newName: string;
  cleanName: string;
  status: FolderStatus;
}> {
  const drive = getDriveClient();

  if (!drive) {
    throw new Error('Chưa kết nối Google Drive');
  }

  // 1. Get current folder name from Google Drive
  const current = await drive.files.get({
    fileId: folderId,
    fields: 'id, name',
    supportsAllDrives: true,
  });

  const oldName = current.data.name || '';
  let newName: string;
  let cleanName: string;

  if (customName) {
    newName = customName;
    cleanName = parseFolderStatus(customName).cleanName;
  } else {
    const result = getNewFolderName(oldName, targetStatus);
    newName = result.newName;
    cleanName = result.cleanName;
  }

  // 2. Patch file with new name on Google Drive
  await drive.files.update({
    fileId: folderId,
    requestBody: {
      name: newName,
    },
    supportsAllDrives: true,
  });

  return {
    success: true,
    oldName,
    newName,
    cleanName,
    status: targetStatus,
  };
}

/**
 * Create a new folder on Google Drive (Batch folder or Subfolder)
 */
export async function createDriveFolder(name: string, parentFolderId?: string): Promise<DriveFolder> {
  const drive = getDriveClient();
  const config = getDriveConfig();

  if (!drive) {
    throw new Error('Chưa kết nối Google Drive');
  }

  const parentId = parentFolderId || config.rootFolderId;

  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id, name, modifiedTime, createdTime',
    supportsAllDrives: true,
  });

  const file = res.data;
  const { cleanName, status } = parseFolderStatus(file.name || '');

  return {
    id: file.id!,
    name: file.name || '',
    cleanName,
    status,
    parentId,
    modifiedTime: file.modifiedTime || undefined,
  };
}

/**
 * Upload a binary file (image or text document) to a specific Google Drive folder
 */
export async function uploadDriveFile(
  folderId: string,
  name: string,
  mimeType: string,
  buffer: Buffer
): Promise<DriveFile> {
  const drive = getDriveClient();

  if (!drive) {
    throw new Error('Chưa kết nối Google Drive');
  }

  const { Readable } = await import('stream');
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  const res = await drive.files.create({
    requestBody: {
      name,
      parents: [folderId],
    },
    media: {
      mimeType: mimeType || 'application/octet-stream',
      body: stream,
    },
    fields: 'id, name, mimeType, size, modifiedTime, thumbnailLink, webContentLink, webViewLink',
    supportsAllDrives: true,
  });

  const file = res.data;
  const isImage = (file.mimeType || '').startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(name);
  const isText = (file.mimeType || '').startsWith('text/') || /\.(txt|json|md|csv|log)$/i.test(name);

  return {
    id: file.id!,
    name: file.name || name,
    mimeType: file.mimeType || mimeType,
    size: file.size ? Number(file.size) : buffer.length,
    modifiedTime: file.modifiedTime || new Date().toISOString(),
    thumbnailLink: `/api/drive/proxy-image?fileId=${file.id}`,
    webContentLink: `/api/drive/proxy-image?fileId=${file.id}`,
    webViewLink: file.webViewLink || undefined,
    isImage,
    isText,
  };
}
