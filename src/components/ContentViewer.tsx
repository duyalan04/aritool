'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Save, 
  Check, 
  Clock, 
  X, 
  RotateCcw, 
  ExternalLink,
  Eye,
  Info,
  CheckCircle2,
  FolderOpen
} from 'lucide-react';
import { DriveFolder, DriveFile, FolderStatus } from '@/lib/types';
import { STATUS_CONFIG } from '@/lib/status-helper';
import { ImageViewerModal } from './ImageViewerModal';

interface ContentViewerProps {
  selectedFolder: DriveFolder | null;
  files: DriveFile[];
  activeTextContent: string;
  onTextContentChange: (content: string) => void;
  onSaveText: (fileId: string, content: string) => Promise<void>;
  onUpdateStatus: (folderId: string, targetStatus: FolderStatus) => Promise<void>;
  isSaving: boolean;
  isLoadingFiles: boolean;
}

export const ContentViewer: React.FC<ContentViewerProps> = ({
  selectedFolder,
  files,
  activeTextContent,
  onTextContentChange,
  onSaveText,
  onUpdateStatus,
  isSaving,
  isLoadingFiles,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'images'>('text');
  const [selectedImageFile, setSelectedImageFile] = useState<DriveFile | null>(null);
  const [initialText, setInitialText] = useState<string>('');
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Filter text files and image files
  const textFiles = files.filter((f) => f.isText);
  const imageFiles = files.filter((f) => f.isImage);
  const currentTextFile = textFiles[0] || null;

  // Track changes to show "unsaved" state
  useEffect(() => {
    setInitialText(activeTextContent);
    setIsDirty(false);
  }, [selectedFolder?.id]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onTextContentChange(val);
    setIsDirty(val !== initialText);
  };

  const handleSave = async () => {
    if (!currentTextFile) return;
    await onSaveText(currentTextFile.id, activeTextContent);
    setInitialText(activeTextContent);
    setIsDirty(false);
  };

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (currentTextFile && isDirty) {
          handleSave();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTextFile, isDirty, activeTextContent]);

  if (!selectedFolder) {
    return (
      <main className="column-panel viewer-panel">
        <div className="empty-state">
          <FolderOpen size={48} className="empty-state-icon" />
          <p className="empty-state-title">Chưa chọn thư mục hồ sơ</p>
          <p className="empty-state-desc">
            Vui lòng chọn một thư mục con ở cột giữa để xem và chỉnh sửa file text (.txt) hoặc xem ảnh.
          </p>
        </div>
      </main>
    );
  }

  const statusConfig = STATUS_CONFIG[selectedFolder.status] || STATUS_CONFIG.NONE;

  return (
    <main className="column-panel viewer-panel">
      {/* Top Header Bar with Status Actions */}
      <div className="viewer-header-tabs">
        {/* Left: Folder Name & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {selectedFolder.cleanName}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Tên trên Drive: {selectedFolder.name}
            </div>
          </div>
          <span className={`status-badge ${statusConfig.badgeClass}`}>
            {statusConfig.badgeText}
          </span>
        </div>

        {/* Right: Quick Action Buttons directly in viewer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className={`btn-action btn-action-ok ${selectedFolder.status === 'OK' ? 'active' : ''}`}
            onClick={() => onUpdateStatus(selectedFolder.id, 'OK')}
            style={{ padding: '7px 14px', fontSize: '0.8rem' }}
          >
            <Check size={15} />
            <span>✓ Xong (_OK)</span>
          </button>

          <button
            className={`btn-action btn-action-wait ${selectedFolder.status === '2_3_DAY' ? 'active' : ''}`}
            onClick={() => onUpdateStatus(selectedFolder.id, '2_3_DAY')}
            style={{ padding: '7px 14px', fontSize: '0.8rem' }}
          >
            <Clock size={15} />
            <span>⏳ Chờ (_2_3_DAY)</span>
          </button>

          <button
            className={`btn-action btn-action-ko ${selectedFolder.status === 'KO' ? 'active' : ''}`}
            onClick={() => onUpdateStatus(selectedFolder.id, 'KO')}
            style={{ padding: '7px 14px', fontSize: '0.8rem' }}
          >
            <X size={15} />
            <span>✕ Lỗi (_KO)</span>
          </button>

          {selectedFolder.status !== 'NONE' && (
            <button
              className="btn-action btn-action-reset"
              onClick={() => onUpdateStatus(selectedFolder.id, 'NONE')}
              title="Bỏ đuôi trạng thái, khôi phục tên gốc"
              style={{ height: 34, width: 34 }}
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation: Text File vs Images */}
      <div style={{ padding: '8px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.15)' }}>
        <div className="tabs-group">
          <button
            className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
            onClick={() => setActiveTab('text')}
          >
            <FileText size={15} />
            <span>File Text {currentTextFile ? `(${currentTextFile.name})` : '(0)'}</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'images' ? 'active' : ''}`}
            onClick={() => setActiveTab('images')}
          >
            <ImageIcon size={15} />
            <span>Hình ảnh ({imageFiles.length})</span>
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="viewer-body">
        {isLoadingFiles ? (
          <div className="empty-state">
            <div className="spinner" style={{ width: 32, height: 32 }} />
            <p className="empty-state-title">Đang tải nội dung thư mục...</p>
          </div>
        ) : activeTab === 'text' ? (
          /* Text Editor Tab */
          currentTextFile ? (
            <div className="editor-container">
              {/* Toolbar */}
              <div className="editor-toolbar">
                <div className="editor-file-title">
                  <FileText size={16} />
                  <span>{currentTextFile.name}</span>
                  {isDirty && <span className="dirty-tag">Chưa lưu *</span>}
                </div>

                <div className="editor-actions">
                  <button
                    className="btn-primary"
                    onClick={handleSave}
                    disabled={isSaving || !isDirty}
                    title="Lưu nội dung vào Google Drive (Ctrl+S)"
                  >
                    <Save size={15} className={isSaving ? 'spinner' : ''} />
                    <span>{isSaving ? 'Đang lưu...' : 'Lưu File (Ctrl+S)'}</span>
                  </button>
                </div>
              </div>

              {/* Text Area */}
              <textarea
                className="text-area-editor"
                value={activeTextContent}
                onChange={handleTextChange}
                placeholder="Nội dung file text..."
                spellCheck={false}
              />

              {/* Footer info */}
              <div className="editor-footer">
                <div>
                  <span>Ký tự: {activeTextContent.length}</span> |{' '}
                  <span>Dòng: {activeTextContent.split('\n').length}</span>
                </div>
                <div>
                  <span>Cập nhật lần cuối: {currentTextFile.modifiedTime ? new Date(currentTextFile.modifiedTime).toLocaleTimeString() : 'Vừa xong'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <FileText size={36} className="empty-state-icon" />
              <p className="empty-state-title">Không tìm thấy file .txt nào</p>
              <p className="empty-state-desc">Thư mục này chưa có file văn bản (.txt) nào.</p>
            </div>
          )
        ) : (
          /* Images Tab */
          imageFiles.length > 0 ? (
            <div className="images-grid">
              {imageFiles.map((img) => {
                const src = `/api/drive/proxy-image?fileId=${img.id}`;
                return (
                  <div
                    key={img.id}
                    className="image-card"
                    onClick={() => setSelectedImageFile(img)}
                  >
                    <div className="image-preview-wrapper">
                      <img src={src} alt={img.name} className="image-preview-img" />
                      <div className="image-hover-overlay">
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'white', fontWeight: 600, fontSize: '0.85rem' }}>
                          <Eye size={16} /> Phóng to xem chi tiết
                        </span>
                      </div>
                    </div>

                    <div className="image-info-bar">
                      <span className="image-filename" title={img.name}>{img.name}</span>
                      {img.size && (
                        <span className="image-filesize">
                          {(img.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <ImageIcon size={36} className="empty-state-icon" />
              <p className="empty-state-title">Không có file hình ảnh</p>
              <p className="empty-state-desc">Thư mục này không chứa file ảnh nào (.png, .jpg, .webp).</p>
            </div>
          )
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      <ImageViewerModal
        file={selectedImageFile}
        onClose={() => setSelectedImageFile(null)}
      />
    </main>
  );
};
