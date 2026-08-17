import { FolderStatus } from './types';

const STATUS_SUFFIXES = {
  OK: '_OK',
  '2_3_DAY': '_2_3_DAY',
  KO: '_KO',
} as const;

/**
 * Detects the status from folder name
 */
export function parseFolderStatus(name: string): { cleanName: string; status: FolderStatus } {
  const trimmed = name.trim();

  // Check _OK (case insensitive, allow space or underscore)
  if (/_OK$/i.test(trimmed)) {
    return {
      cleanName: trimmed.replace(/_OK$/i, '').trim(),
      status: 'OK',
    };
  }

  // Check _2_3_DAY or _2_3_DAYS or _2-3-DAY
  if (/(_2_3_DAY|_2_3_DAYS|_2-3-DAY|_23DAY)$/i.test(trimmed)) {
    return {
      cleanName: trimmed.replace(/(_2_3_DAY|_2_3_DAYS|_2-3-DAY|_23DAY)$/i, '').trim(),
      status: '2_3_DAY',
    };
  }

  // Check _KO or _NOT_OK
  if (/(_KO|_NOT_OK)$/i.test(trimmed)) {
    return {
      cleanName: trimmed.replace(/(_KO|_NOT_OK)$/i, '').trim(),
      status: 'KO',
    };
  }

  return {
    cleanName: trimmed,
    status: 'NONE',
  };
}

/**
 * Generates the new folder name based on desired status
 */
export function getNewFolderName(currentName: string, targetStatus: FolderStatus): { newName: string; cleanName: string } {
  const { cleanName } = parseFolderStatus(currentName);

  if (targetStatus === 'NONE') {
    return { newName: cleanName, cleanName };
  }

  const suffix = STATUS_SUFFIXES[targetStatus];
  return {
    newName: `${cleanName}${suffix}`,
    cleanName,
  };
}

/**
 * Status UI configurations (labels, badges, colors, icons)
 */
export const STATUS_CONFIG = {
  NONE: {
    label: 'Chưa xử lý',
    badgeText: 'PENDING',
    badgeClass: 'status-badge-pending',
    color: '#64748b',
    bgColor: 'rgba(100, 116, 139, 0.12)',
    borderColor: 'rgba(100, 116, 139, 0.3)',
    description: 'Chưa gắn trạng thái',
    shortcut: '0',
  },
  OK: {
    label: 'Hoàn thành (Done)',
    badgeText: 'DONE / OK',
    badgeClass: 'status-badge-ok',
    suffix: '_OK',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    description: 'Đã hoàn thành bộ hồ sơ',
    shortcut: '1',
  },
  '2_3_DAY': {
    label: 'Chờ 2-3 ngày',
    badgeText: '2-3 NGÀY',
    badgeClass: 'status-badge-wait',
    suffix: '_2_3_DAY',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    description: 'Chờ 2-3 ngày mới duyệt',
    shortcut: '2',
  },
  KO: {
    label: 'Không được (KO)',
    badgeText: 'KHÔNG ĐƯỢC',
    badgeClass: 'status-badge-ko',
    suffix: '_KO',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    description: 'Bộ hồ sơ bị từ chối / lỗi',
    shortcut: '3',
  },
} as const;
