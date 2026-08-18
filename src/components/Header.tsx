'use client';

import React from 'react';
import { 
  FolderTree, 
  ChevronRight, 
  RefreshCw, 
  Settings, 
  Keyboard, 
  HardDrive,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { DriveFolder, DriveConnectionStatus } from '@/lib/types';

interface HeaderProps {
  connectionStatus: DriveConnectionStatus | null;
  selectedBatch: DriveFolder | null;
  selectedSubfolder: DriveFolder | null;
  onSelectBatch: (batch: DriveFolder | null) => void;
  onRefresh: () => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  isLoading: boolean;
  isAutoSyncEnabled?: boolean;
  onToggleAutoSync?: () => void;
  lastSyncTime?: Date;
  deviceName?: string;
  onRenameDevice?: () => void;
  totalActiveUsers?: number;
}

export const Header: React.FC<HeaderProps> = ({
  connectionStatus,
  selectedBatch,
  selectedSubfolder,
  onSelectBatch,
  onRefresh,
  onOpenSettings,
  onOpenShortcuts,
  isLoading,
  isAutoSyncEnabled = true,
  onToggleAutoSync,
  lastSyncTime,
  deviceName = 'Máy của bạn',
  onRenameDevice,
  totalActiveUsers = 1,
}) => {
  return (
    <header className="app-header">
      {/* Brand Logo & Name */}
      <div className="brand-section">
        <div className="logo-badge">
          <FolderTree size={22} />
        </div>
        <div>
          <h1 className="brand-title">ARI DRIVE EXPLORER</h1>
          <p className="brand-subtitle">Trình quản lý & Đổi trạng thái hồ sơ Drive</p>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <div className="breadcrumb-container">
        <div 
          className={`breadcrumb-item ${!selectedBatch ? 'active' : ''}`}
          onClick={() => onSelectBatch(null)}
        >
          <HardDrive size={15} />
          <span>{connectionStatus?.rootFolderName || 'ARI'}</span>
        </div>

        {selectedBatch && (
          <>
            <ChevronRight size={13} className="breadcrumb-separator" />
            <div 
              className={`breadcrumb-item ${!selectedSubfolder ? 'active' : ''}`}
              onClick={() => {}}
            >
              <span>{selectedBatch.name}</span>
            </div>
          </>
        )}

        {selectedSubfolder && (
          <>
            <ChevronRight size={13} className="breadcrumb-separator" />
            <div className="breadcrumb-item active">
              <span>{selectedSubfolder.name}</span>
            </div>
          </>
        )}
      </div>

      {/* Actions & Connection Info */}
      <div className="header-actions">
        {/* Device Name Pill (Click to rename) */}
        <button
          className="device-badge-btn"
          onClick={onRenameDevice}
          title="Nhấn để đổi tên máy hiển thị cho đồng nghiệp (ví dụ: Máy 1, Máy 2, Duy, Huy...)"
        >
          <span>💻 {deviceName}</span>
          {totalActiveUsers > 1 && (
            <span style={{ background: 'rgba(56, 189, 248, 0.25)', color: '#38bdf8', padding: '1px 6px', borderRadius: 10, fontSize: '0.7rem' }}>
              👥 {totalActiveUsers} online
            </span>
          )}
        </button>

        {/* Auto-Sync Realtime Status Indicator */}
        <div
          className={`connection-pill ${isAutoSyncEnabled ? '' : 'error'}`}
          onClick={onToggleAutoSync}
          style={{ cursor: 'pointer', background: isAutoSyncEnabled ? 'rgba(56, 189, 248, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: isAutoSyncEnabled ? '#38bdf8' : '#f87171', borderColor: isAutoSyncEnabled ? 'rgba(56, 189, 248, 0.3)' : 'rgba(239, 68, 68, 0.3)' }}
          title={isAutoSyncEnabled ? `Đang tự động đồng bộ thời gian thực mỗi 6s. Cập nhật lần cuối: ${lastSyncTime ? lastSyncTime.toLocaleTimeString() : 'vừa xong'}. Nhấn để Bật/Tắt.` : 'Tự động đồng bộ đang TẮT. Nhấn để BẬT lại.'}
        >
          <span className="pulsing-dot" style={{ backgroundColor: isAutoSyncEnabled ? '#38bdf8' : '#f87171' }} />
          <span>{isAutoSyncEnabled ? 'Auto-Sync 6s' : 'Sync Tắt'}</span>
        </div>

        {connectionStatus && (
          <div 
            className={`connection-pill ${
              connectionStatus.connected 
                ? '' 
                : 'error'
            }`}
            onClick={onOpenSettings}
            style={{ cursor: 'pointer' }}
            title={
              connectionStatus.connected 
                ? `Đã kết nối Google Drive (${connectionStatus.accountEmail || 'Service Account'})` 
                : `${connectionStatus.error || 'Chưa cấu hình Google Drive'}. Nhấn để xem hướng dẫn cài đặt.`
            }
          >
            <span className="pulsing-dot" />
            <span>
              {connectionStatus.connected 
                ? 'Đã kết nối Drive' 
                : 'Chưa kết nối Drive ⚙'}
            </span>
          </div>
        )}

        {/* Refresh Button */}
        <button 
          className="btn-icon" 
          onClick={onRefresh} 
          disabled={isLoading}
          title="Tải lại dữ liệu"
        >
          <RefreshCw size={16} className={isLoading ? 'spinner' : ''} />
        </button>

        {/* Keyboard Shortcuts Button */}
        <button 
          className="btn-icon" 
          onClick={onOpenShortcuts}
          title="Phím tắt nhanh"
        >
          <Keyboard size={16} />
        </button>

        {/* Settings Button */}
        <button 
          className="btn-icon" 
          onClick={onOpenSettings}
          title="Cài đặt kết nối Google Drive"
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
};
