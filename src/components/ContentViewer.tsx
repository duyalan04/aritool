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
  Columns, 
  Eye, 
  FolderOpen,
  ZoomIn
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
  const [viewMode, setViewMode] = useState<'split' | 'text' | 'images'>('split');
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
      <main className="column-panel viewer-panel" style={{ flex: 1 }}>
        <div className="empty-state">
          <FolderOpen size={48} className="empty-state-icon" />
          <p className="empty-state-title">Chưa chọn thư mục hồ sơ</p>
          <p className="empty-state-desc">
            Vui lòng chọn một thư mục con ở cột giữa để xem và chỉnh sửa file text (.txt) hoặc đối chiếu ảnh.
          </p>
        </div>
      </main>
    );
  }

  const statusConfig = STATUS_CONFIG[selectedFolder.status] || STATUS_CONFIG.NONE;

  // Render Text Editor Component
  const renderTextEditor = (isSplit = false) => {
    if (!currentTextFile) {
      return (
        <div className="empty-state" style={{ height: '100%', background: 'rgba(15, 23, 42, 0.5)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          <FileText size={36} className="empty-state-icon" />
          <p className="empty-state-title">Không tìm thấy file .txt</p>
          <p className="empty-state-desc">Thư mục này chưa có file văn bản (.txt) nào.</p>
        </div>
      );
    }

    return (
      <div className="editor-container" style={{ height: '100%' }}>
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
            <span>{currentTextFile.modifiedTime ? new Date(currentTextFile.modifiedTime).toLocaleTimeString() : 'Vừa xong'}</span>
          </div>
        </div>
      </div>
    );
  };

  // Render Images Gallery Component
  const renderImagesGallery = (isSplit = false) => {
    if (imageFiles.length === 0) {
      return (
        <div className="empty-state" style={{ height: '100%', background: 'rgba(15, 23, 42, 0.5)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          <ImageIcon size={36} className="empty-state-icon" />
          <p className="empty-state-title">Không có file hình ảnh</p>
          <p className="empty-state-desc">Thư mục này không chứa file ảnh nào (.png, .jpg, .webp).</p>
        </div>
      );
    }

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'rgba(15, 23, 42, 0.85)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
        <div className="editor-toolbar" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
          <div className="editor-file-title" style={{ color: '#a78bfa' }}>
            <ImageIcon size={16} />
            <span>Hình ảnh Tài liệu / Passport ({imageFiles.length})</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Click ảnh để phóng to & kéo chuột
          </span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: isSplit ? 12 : 20 }}>
          <div 
            className="images-grid" 
            style={{ 
              gridTemplateColumns: isSplit ? 'repeat(auto-fill, minmax(200px, 1fr))' : 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: isSplit ? 12 : 16 
            }}
          >
            {imageFiles.map((img) => {
              const src = `/api/drive/proxy-image?fileId=${img.id}`;
              return (
                <div
                  key={img.id}
                  className="image-card"
                  onClick={() => setSelectedImageFile(img)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="image-preview-wrapper" style={{ height: isSplit ? 160 : 220 }}>
                    <img src={src} alt={img.name} className="image-preview-img" loading="lazy" />
                    <div className="image-hover-overlay">
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'white', fontWeight: 600, fontSize: '0.82rem' }}>
                        <ZoomIn size={16} /> Phóng to (Zoom)
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
        </div>
      </div>
    );
  };

  return (
    <main className="column-panel viewer-panel" style={{ flex: 1, width: '100%', minWidth: 0 }}>
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
        {(() => {
          const isProcessed = selectedFolder.status !== 'NONE';
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                className={`btn-action btn-action-ok ${selectedFolder.status === 'OK' ? 'active' : ''} ${isProcessed && selectedFolder.status !== 'OK' ? 'btn-dimmed' : ''}`}
                onClick={() => onUpdateStatus(selectedFolder.id, 'OK')}
                disabled={isSaving || isProcessed}
                style={{ padding: '7px 14px', fontSize: '0.8rem' }}
                title={isProcessed ? 'Hồ sơ đã gắn trạng thái' : 'Đổi tên thành [TÊN]_OK (Phím 1)'}
              >
                <Check size={15} />
                <span>Xong (_OK)</span>
              </button>

              <button
                className={`btn-action btn-action-wait ${selectedFolder.status === '2_3_DAY' ? 'active' : ''} ${isProcessed && selectedFolder.status !== '2_3_DAY' ? 'btn-dimmed' : ''}`}
                onClick={() => onUpdateStatus(selectedFolder.id, '2_3_DAY')}
                disabled={isSaving || isProcessed}
                style={{ padding: '7px 14px', fontSize: '0.8rem' }}
                title={isProcessed ? 'Hồ sơ đã gắn trạng thái' : 'Đổi tên thành [TÊN]_2_3_DAY (Phím 2)'}
              >
                <Clock size={15} />
                <span>Chờ (_2_3_DAY)</span>
              </button>

              <button
                className={`btn-action btn-action-ko ${selectedFolder.status === 'KO' ? 'active' : ''} ${isProcessed && selectedFolder.status !== 'KO' ? 'btn-dimmed' : ''}`}
                onClick={() => onUpdateStatus(selectedFolder.id, 'KO')}
                disabled={isSaving || isProcessed}
                style={{ padding: '7px 14px', fontSize: '0.8rem' }}
                title={isProcessed ? 'Hồ sơ đã gắn trạng thái' : 'Đổi tên thành [TÊN]_KO (Phím 3)'}
              >
                <X size={15} />
                <span>Lỗi (_KO)</span>
              </button>

              {isProcessed && (
                <button
                  className="btn-action-restore-active"
                  onClick={() => onUpdateStatus(selectedFolder.id, 'NONE')}
                  title="Bỏ đuôi trạng thái, khôi phục tên gốc ban đầu (Phím 0)"
                  style={{ height: 34, padding: '7px 14px', fontSize: '0.8rem' }}
                >
                  <RotateCcw size={14} />
                  <span>Khôi phục gốc</span>
                </button>
              )}
            </div>
          );
        })()}
      </div>

      {/* Tabs Navigation: Split View vs Text Only vs Images Only */}
      <div style={{ padding: '8px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="tabs-group">
          <button
            className={`tab-btn ${viewMode === 'split' ? 'active' : ''}`}
            onClick={() => setViewMode('split')}
            title="Xem cùng lúc File Text và Ảnh để đối chiếu nhanh"
          >
            <Columns size={15} />
            <span>Song song (Text + Ảnh)</span>
          </button>

          <button
            className={`tab-btn ${viewMode === 'text' ? 'active' : ''}`}
            onClick={() => setViewMode('text')}
          >
            <FileText size={15} />
            <span>Chỉ xem Text {currentTextFile ? `(${currentTextFile.name})` : '(0)'}</span>
          </button>

          <button
            className={`tab-btn ${viewMode === 'images' ? 'active' : ''}`}
            onClick={() => setViewMode('images')}
          >
            <ImageIcon size={15} />
            <span>Chỉ xem Ảnh ({imageFiles.length})</span>
          </button>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {viewMode === 'split' && '⚡ Chế độ đối chiếu Song Song (Text & Passport)'}
        </div>
      </div>

      {/* Body Content with 100% Space Utilization */}
      <div className="viewer-body" style={{ flex: 1, padding: 16, overflow: 'hidden' }}>
        {isLoadingFiles ? (
          <div className="empty-state">
            <div className="spinner" style={{ width: 32, height: 32 }} />
            <p className="empty-state-title">Đang tải nội dung thư mục...</p>
          </div>
        ) : viewMode === 'split' ? (
          /* Split View: Left (Text Editor) + Right (Image Gallery) */
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: (currentTextFile && imageFiles.length > 0) ? '1fr 1fr' : '1fr', 
              gap: 16, 
              height: '100%', 
              minHeight: 0 
            }}
          >
            {/* Left Column: Text Editor */}
            <div style={{ height: '100%', minHeight: 0, overflow: 'hidden' }}>
              {renderTextEditor(true)}
            </div>

            {/* Right Column: Image Gallery / Passport */}
            {imageFiles.length > 0 && (
              <div style={{ height: '100%', minHeight: 0, overflow: 'hidden' }}>
                {renderImagesGallery(true)}
              </div>
            )}
          </div>
        ) : viewMode === 'text' ? (
          /* Full Width Text View */
          <div style={{ height: '100%', minHeight: 0, overflow: 'hidden' }}>
            {renderTextEditor(false)}
          </div>
        ) : (
          /* Full Width Images View */
          <div style={{ height: '100%', minHeight: 0, overflow: 'hidden' }}>
            {renderImagesGallery(false)}
          </div>
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
