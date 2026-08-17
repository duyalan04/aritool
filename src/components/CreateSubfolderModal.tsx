'use client';

import React, { useState, useRef } from 'react';
import { X, FolderPlus, Upload, FileText, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { DriveFolder } from '@/lib/types';

interface CreateSubfolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchFolder: DriveFolder | null;
  onSuccess: (newSubfolder: DriveFolder) => void;
}

export const CreateSubfolderModal: React.FC<CreateSubfolderModalProps> = ({
  isOpen,
  onClose,
  batchFolder,
  onSuccess,
}) => {
  const [subfolderName, setSubfolderName] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !batchFolder) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subfolderName.trim()) return;

    try {
      setIsLoading(true);
      setErrorMessage('');
      setStatusMessage(`Đang tạo hồ sơ "${subfolderName.trim()}" trong ${batchFolder.name}...`);

      // 1. Create subfolder
      const res = await fetch('/api/drive/create-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: subfolderName.trim(),
          parentId: batchFolder.id,
        }),
      });

      const data = await res.json();
      if (!data.success || !data.folder) {
        throw new Error(data.error || 'Không thể tạo hồ sơ con');
      }

      const newFolder: DriveFolder = data.folder;

      // 2. Upload any attached files
      if (selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          setStatusMessage(`Đang tải file (${i + 1}/${selectedFiles.length}): ${file.name}...`);

          const formData = new FormData();
          formData.append('folderId', newFolder.id);
          formData.append('fileName', file.name);
          formData.append('file', file);

          await fetch('/api/drive/upload-file', {
            method: 'POST',
            body: formData,
          });
        }
      }

      onSuccess(newFolder);
      onClose();
    } catch (err: any) {
      console.error('Create subfolder error:', err);
      setErrorMessage(err.message || 'Lỗi khi tạo hồ sơ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={() => !isLoading && onClose()}>
      <div 
        className="modal-container" 
        style={{ maxWidth: '520px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FolderPlus size={18} color="#38bdf8" />
            <span>Thêm Hồ Sơ Mới vào {batchFolder.name}</span>
          </div>
          {!isLoading && (
            <button className="btn-icon" onClick={onClose}>
              <X size={18} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="modal-body" style={{ padding: 20 }}>
          {errorMessage && (
            <div className="alert alert-error" style={{ marginBottom: 14 }}>
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Tên Hồ Sơ (Tên Khách Hàng / Mã bộ):
            </label>
            <input
              type="text"
              className="search-input"
              style={{ width: '100%', padding: '10px 12px' }}
              placeholder="Ví dụ: VANESSA PADILLA, NGUYEN VAN A..."
              value={subfolderName}
              onChange={(e) => setSubfolderName(e.target.value)}
              autoFocus
              required
              disabled={isLoading}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              File đính kèm (Ảnh / File text) (Tùy chọn):
            </label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.txt,.json"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              disabled={isLoading}
            />

            <button
              type="button"
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center', padding: '10px', borderStyle: 'dashed' }}
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Upload size={16} />
              <span>{selectedFiles.length > 0 ? `Đã chọn ${selectedFiles.length} tệp` : 'Chọn file ảnh / txt để tải lên cùng'}</span>
            </button>

            {selectedFiles.length > 0 && (
              <div style={{ marginTop: 8, maxHeight: 90, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {selectedFiles.map((f, i) => (
                  <div key={i} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {f.type.startsWith('image/') ? <ImageIcon size={12} /> : <FileText size={12} />}
                    <span>{f.name} ({(f.size / 1024).toFixed(1)} KB)</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isLoading && (
            <div style={{ fontSize: '0.8rem', color: '#38bdf8', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Loader2 size={16} className="spinner" />
              <span>{statusMessage}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '11px', justifyContent: 'center' }}
            disabled={isLoading || !subfolderName.trim()}
          >
            {isLoading ? 'Đang tạo...' : '+ Tạo Hồ Sơ Ngay'}
          </button>
        </form>
      </div>
    </div>
  );
};
