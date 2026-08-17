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
