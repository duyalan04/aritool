export type FolderStatus = 'NONE' | 'OK' | '2_3_DAY' | 'KO';

export interface DriveFolder {
  id: string;
  name: string;
  cleanName: string;
  status: FolderStatus;
  parentId?: string;
  modifiedTime?: string;
  fileCount?: number;
  hasImages?: boolean;
  hasTxt?: boolean;
  childrenCount?: number;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  modifiedTime?: string;
  thumbnailLink?: string;
  webContentLink?: string;
  webViewLink?: string;
  isImage: boolean;
  isText: boolean;
  content?: string;
}

export interface BatchSummary {
  id: string;
  name: string;
  totalSubfolders: number;
  doneCount: number;
  twoThreeDayCount: number;
  koCount: number;
  pendingCount: number;
}

export interface DriveStats {
  totalBatches: number;
  totalItems: number;
  totalDone: number;
  totalTwoThreeDay: number;
  totalKo: number;
  totalPending: number;
}

export interface RenameResult {
  success: boolean;
  id: string;
  oldName: string;
  newName: string;
  cleanName: string;
  status: FolderStatus;
  message?: string;
}

export interface SaveFileResult {
  success: boolean;
  id: string;
  name: string;
  modifiedTime: string;
  message?: string;
}

export interface DriveConnectionStatus {
  connected: boolean;
  mode: 'service_account' | 'oauth' | 'mock';
  rootFolderName: string;
  rootFolderId: string;
  accountEmail?: string;
  error?: string;
}

export interface ActiveViewer {
  deviceId: string;
  deviceName: string;
  lastSeen: number;
}

