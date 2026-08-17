'use client';

import React from 'react';
import { 
  Folder, 
  FolderCheck, 
  FolderClock, 
  FolderX,
  FileText, 
  Image as ImageIcon,
  Check, 
  Clock, 
  X, 
  RotateCcw,
  Plus
} from 'lucide-react';
import { DriveFolder, FolderStatus } from '@/lib/types';
import { STATUS_CONFIG } from '@/lib/status-helper';

interface SubfolderListProps {
  subfolders: DriveFolder[];
  selectedSubfolder: DriveFolder | null;
  onSelectSubfolder: (folder: DriveFolder) => void;
  onUpdateStatus: (folderId: string, targetStatus: FolderStatus) => Promise<void>;
  loadingFolderId: string | null;
  onOpenCreateSubfolderModal?: () => void;
}

export const SubfolderList: React.FC<SubfolderListProps> = ({
  subfolders,
  selectedSubfolder,
  onSelectSubfolder,
  onUpdateStatus,
  loadingFolderId,
  onOpenCreateSubfolderModal,
}) => {
  return (
    <section className="column-panel subfolder-panel">
      {/* Column Header */}
      <div className="column-header">
        <div className="column-title">
          <Folder size={16} color="#38bdf8" />
          <span>Danh sách Hồ sơ Con</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {onOpenCreateSubfolderModal && (
            <button
              className="btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 9px',
                fontSize: '0.74rem',
                height: 26,
                borderRadius: 'var(--radius-sm)',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
              onClick={onOpenCreateSubfolderModal}
              title="Thêm 1 hồ sơ mới vào bộ này"
            >
              <Plus size={13} />
              <span>Thêm hồ sơ</span>
            </button>
          )}
          <span className="count-tag">{subfolders.length} mục</span>
        </div>
      </div>

      {/* Subfolder Scrollable List */}
      <div className="subfolder-scrollable">
        {subfolders.length === 0 ? (
          <div className="empty-state">
            <Folder size={36} className="empty-state-icon" />
            <p className="empty-state-title">Không tìm thấy hồ sơ nào</p>
            <p className="empty-state-desc">Không có thư mục con nào phù hợp với bộ lọc hoặc tìm kiếm hiện tại.</p>
          </div>
        ) : (
          subfolders.map((folder) => {
            const isSelected = selectedSubfolder?.id === folder.id;
            const isLoading = loadingFolderId === folder.id;
            const statusConfig = STATUS_CONFIG[folder.status] || STATUS_CONFIG.NONE;

            // Choose icon according to status
            let FolderIcon = Folder;
            let folderIconColor = '#94a3b8';
            if (folder.status === 'OK') {
              FolderIcon = FolderCheck;
              folderIconColor = 'var(--status-ok)';
            } else if (folder.status === '2_3_DAY') {
              FolderIcon = FolderClock;
              folderIconColor = 'var(--status-wait)';
            } else if (folder.status === 'KO') {
              FolderIcon = FolderX;
              folderIconColor = 'var(--status-ko)';
            }

            const isProcessed = folder.status !== 'NONE';

            return (
              <div
                key={folder.id}
                className={`subfolder-card ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectSubfolder(folder)}
              >
                {/* Top Row: Name, Clean Name, Status Badge */}
                <div className="subfolder-card-top">
                  <div className="subfolder-name-row">
                    <FolderIcon size={20} color={folderIconColor} style={{ flexShrink: 0 }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="subfolder-name" title={folder.name}>
                        {folder.cleanName}
                      </div>
                      <div className="subfolder-clean-name" title={folder.name}>
                        Tên Drive: {folder.name}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span className={`status-badge ${statusConfig.badgeClass}`}>
                    {statusConfig.badgeText}
                  </span>
                </div>

                {/* Quick 1-Click Action Buttons */}
                <div 
                  className="quick-action-bar"
                  onClick={(e) => e.stopPropagation()} // Prevent card selection click
                >
                  {!isProcessed ? (
                    <>
                      {/* Button 1: DONE / _OK */}
                      <button
                        className="btn-action btn-action-ok"
                        onClick={() => onUpdateStatus(folder.id, 'OK')}
                        disabled={isLoading}
                        title="Đổi tên thành [TÊN]_OK (Phím 1)"
                      >
                        <Check size={13} />
                        <span>Done</span>
                      </button>

                      {/* Button 2: 2-3 NGÀY / _2_3_DAY */}
                      <button
                        className="btn-action btn-action-wait"
                        onClick={() => onUpdateStatus(folder.id, '2_3_DAY')}
                        disabled={isLoading}
                        title="Đổi tên thành [TÊN]_2_3_DAY (Phím 2)"
                      >
                        <Clock size={13} />
                        <span>2-3 Ngày</span>
                      </button>

                      {/* Button 3: KO / _KO */}
                      <button
                        className="btn-action btn-action-ko"
                        onClick={() => onUpdateStatus(folder.id, 'KO')}
                        disabled={isLoading}
                        title="Đổi tên thành [TÊN]_KO (Phím 3)"
                      >
                        <X size={13} />
                        <span>KO</span>
                      </button>
                    </>
                  ) : (
                    /* When already processed, show 1 full-width restore button */
                    <button
                      className="btn-action-restore-full"
                      onClick={() => onUpdateStatus(folder.id, 'NONE')}
                      disabled={isLoading}
                      title="Khôi phục tên gốc ban đầu (Bỏ đuôi trạng thái) (Phím 0)"
                    >
                      <RotateCcw size={13} />
                      <span>Khôi phục trạng thái gốc</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
