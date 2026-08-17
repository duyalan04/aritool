'use client';

import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FolderPlus, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  ImageIcon, 
  Folder, 
  Loader2,
  Layers,
  ArrowRight
} from 'lucide-react';
import { DriveFolder } from '@/lib/types';

interface UploadBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (createdFolder?: DriveFolder) => void;
  parentFolderId?: string;
}

interface ParsedBatch {
  rootName: string;
  subfolders: {
    [subfolderName: string]: File[];
  };
  totalFiles: number;
}

export const UploadBatchModal: React.FC<UploadBatchModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  parentFolderId,
}) => {
  const [tab, setTab] = useState<'upload' | 'create'>('upload');
  
  // Create empty folder state
  const [emptyFolderName, setEmptyFolderName] = useState('');
  const [isCreatingEmpty, setIsCreatingEmpty] = useState(false);

  // Upload folder state
  const [parsedBatch, setParsedBatch] = useState<ParsedBatch | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle files selected from folder input
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    processFileList(Array.from(files));
  };

  const processFileList = (fileArray: File[]) => {
    setErrorMessage('');
    setIsSuccess(false);

    let rootName = '';
    const subfolders: { [name: string]: File[] } = {};
    let totalFiles = 0;

    for (const file of fileArray) {
      const relPath = file.webkitRelativePath || file.name;
      const parts = relPath.split('/');

      if (parts.length >= 3) {
        // e.g. "30 bộ lee/VANESSA PADILLA/5.png"
        rootName = parts[0];
        const subfolderName = parts[1];

        if (!subfolders[subfolderName]) {
          subfolders[subfolderName] = [];
        }
        subfolders[subfolderName].push(file);
        totalFiles++;
      } else if (parts.length === 2) {
        // e.g. "VANESSA PADILLA/5.png" (User selected single subfolder)
        rootName = parts[0];
        const subfolderName = parts[0];
        if (!subfolders[subfolderName]) {
          subfolders[subfolderName] = [];
        }
        subfolders[subfolderName].push(file);
        totalFiles++;
      } else {
        // Direct files
        const defName = 'Bộ Hồ Sơ Mới';
        if (!rootName) rootName = defName;
        if (!subfolders['Chung']) subfolders['Chung'] = [];
        subfolders['Chung'].push(file);
        totalFiles++;
      }
    }

    if (!rootName) {
      setErrorMessage('Không nhận diện được cấu trúc thư mục. Vui lòng chọn cả thư mục bộ.');
      return;
    }

    setParsedBatch({
      rootName,
      subfolders,
      totalFiles,
    });
  };

  // Start uploading batch to Google Drive
  const handleStartUpload = async () => {
    if (!parsedBatch) return;

    try {
      setIsUploading(true);
      setErrorMessage('');
      setUploadProgress(0);
      setStatusMessage(`1. Đang tạo thư mục Bộ: "${parsedBatch.rootName}" trên Google Drive...`);

      // 1. Create root batch folder
      const batchRes = await fetch('/api/drive/create-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: parsedBatch.rootName,
          parentId: parentFolderId,
        }),
      });

      const batchData = await batchRes.json();
      if (!batchData.success || !batchData.folder) {
        throw new Error(batchData.error || 'Không thể tạo thư mục Bộ');
      }

      const batchFolder: DriveFolder = batchData.folder;
      const subfolderNames = Object.keys(parsedBatch.subfolders);
      const totalSubfolders = subfolderNames.length;
      const totalFiles = parsedBatch.totalFiles;

      let uploadedFileCount = 0;

      // 2. Loop through each subfolder
      for (let i = 0; i < totalSubfolders; i++) {
        const subName = subfolderNames[i];
        const files = parsedBatch.subfolders[subName];

        setStatusMessage(`2. Đang tạo bộ con (${i + 1}/${totalSubfolders}): "${subName}"...`);

        // Create subfolder on Google Drive
        const subRes = await fetch('/api/drive/create-folder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: subName,
            parentId: batchFolder.id,
          }),
        });

        const subData = await subRes.json();
        if (!subData.success || !subData.folder) {
          console.error(`Không thể tạo thư mục con: ${subName}`);
          continue;
        }

        const subFolderId = subData.folder.id;

        // 3. Upload files to this subfolder
        for (const file of files) {
          setStatusMessage(`3. Đang tải file (${uploadedFileCount + 1}/${totalFiles}): "${file.name}"...`);

          const formData = new FormData();
          formData.append('folderId', subFolderId);
          formData.append('fileName', file.name);
          formData.append('file', file);

          const uploadRes = await fetch('/api/drive/upload-file', {
            method: 'POST',
            body: formData,
          });

          if (!uploadRes.ok) {
            console.error(`Lỗi tải file: ${file.name}`);
          }

          uploadedFileCount++;
          const progressPercent = Math.round((uploadedFileCount / totalFiles) * 100);
          setUploadProgress(progressPercent);
        }
      }

      setIsSuccess(true);
      setStatusMessage(`Hoàn tất tải lên toàn bộ Bộ "${parsedBatch.rootName}" (${totalSubfolders} bộ con, ${totalFiles} files)!`);
      
      setTimeout(() => {
        onSuccess(batchFolder);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Upload batch error:', err);
      setErrorMessage(err.message || 'Lỗi khi tải bộ lên Google Drive');
    } finally {
      setIsUploading(false);
    }
  };

  // Create single empty folder
  const handleCreateEmptyFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emptyFolderName.trim()) return;

    try {
      setIsCreatingEmpty(true);
      setErrorMessage('');

      const res = await fetch('/api/drive/create-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: emptyFolderName.trim(),
          parentId: parentFolderId,
        }),
      });

      const data = await res.json();
      if (!data.success || !data.folder) {
        throw new Error(data.error || 'Không thể tạo thư mục');
      }

      setIsSuccess(true);
      setTimeout(() => {
        onSuccess(data.folder);
        onClose();
      }, 800);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi tạo thư mục');
    } finally {
      setIsCreatingEmpty(false);
    }
  };

  const handleReset = () => {
    setParsedBatch(null);
    setUploadProgress(0);
    setStatusMessage('');
    setErrorMessage('');
    setIsSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="modal-backdrop" onClick={() => !isUploading && onClose()}>
      <div 
        className="modal-container" 
        style={{ maxWidth: '620px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FolderPlus size={20} color="#38bdf8" />
            <span>Thêm Thư Mục Bộ Mới vào ARI</span>
          </div>
          {!isUploading && (
            <button className="btn-icon" onClick={onClose}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.2)' }}>
          <button
            className={`tab-btn ${tab === 'upload' ? 'active' : ''}`}
            onClick={() => !isUploading && setTab('upload')}
            style={{ flex: 1, justifyContent: 'center', borderRadius: 0, padding: '12px' }}
          >
            <UploadCloud size={16} />
            <span>Tải lên cả Thư mục Bộ từ máy</span>
          </button>
          <button
            className={`tab-btn ${tab === 'create' ? 'active' : ''}`}
            onClick={() => !isUploading && setTab('create')}
            style={{ flex: 1, justifyContent: 'center', borderRadius: 0, padding: '12px' }}
          >
            <FolderPlus size={16} />
            <span>Tạo Thư mục trống</span>
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: '24px' }}>
          {errorMessage && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {isSuccess && (
            <div className="alert alert-success" style={{ marginBottom: 16 }}>
              <CheckCircle2 size={18} />
              <span>{statusMessage || 'Thao tác thành công!'}</span>
            </div>
          )}

          {tab === 'upload' ? (
            /* Folder Upload Mode */
            <div>
              {/* Hidden File Input for Folder Selection */}
              <input
                ref={fileInputRef}
                type="file"
                // @ts-ignore
                webkitdirectory=""
                directory=""
                multiple
                style={{ display: 'none' }}
                onChange={handleFilesSelected}
              />

              {!parsedBatch ? (
                /* Dropzone / Select Folder Button */
                <div 
                  className="upload-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed var(--border-medium)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '36px 20px',
                    textAlign: 'center',
                    background: 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <UploadCloud size={28} />
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                    Nhấn để chọn Thư mục Bộ từ máy tính
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 16px' }}>
                    Chọn 1 thư mục chứa các bộ con (ví dụ: <code style={{ color: '#93c5fd' }}>30 bộ lee</code>). Tool sẽ tự động quét các bộ con và các file .txt, hình ảnh bên trong để tải lên Drive.
                  </p>
                  <button type="button" className="btn-primary" style={{ margin: '0 auto', pointerEvents: 'none' }}>
                    <span>Duyệt thư mục trên máy...</span>
                  </button>
                </div>
              ) : (
                /* Parsed Summary & Upload Execution */
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Folder size={22} color="#38bdf8" />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                          {parsedBatch.rootName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Sẽ được tạo trong thư mục ARI trên Google Drive
                        </div>
                      </div>
                    </div>
                    {!isUploading && !isSuccess && (
                      <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={handleReset}>
                        Đổi thư mục khác
                      </button>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
                    <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Layers size={13} /> Số bộ con tìm thấy
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8', marginTop: 4 }}>
                        {Object.keys(parsedBatch.subfolders).length} bộ
                      </div>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FileText size={13} /> Tổng số tệp tin
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#34d399', marginTop: 4 }}>
                        {parsedBatch.totalFiles} files
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar (when uploading) */}
                  {isUploading && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                        <span>Tiến độ tải lên</span>
                        <span style={{ fontWeight: 700, color: '#38bdf8' }}>{uploadProgress}%</span>
                      </div>
                      <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            width: `${uploadProgress}%`, 
                            height: '100%', 
                            background: 'linear-gradient(90deg, #38bdf8, #3b82f6)', 
                            transition: 'width 0.2s ease',
                            boxShadow: '0 0 10px rgba(56, 189, 248, 0.6)'
                          }} 
                        />
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>
                        {statusMessage}
                      </div>
                    </div>
                  )}

                  {/* Upload Action Button */}
                  {!isUploading && !isSuccess && (
                    <button
                      className="btn-primary"
                      style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: '0.9rem' }}
                      onClick={handleStartUpload}
                    >
                      <UploadCloud size={18} />
                      <span>Bắt đầu Tải lên Google Drive 🚀</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Create Empty Folder Mode */
            <form onSubmit={handleCreateEmptyFolder}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Tên thư mục Bộ mới:
                </label>
                <input
                  type="text"
                  className="search-input"
                  style={{ width: '100%', padding: '10px 14px' }}
                  placeholder="Ví dụ: 20 bộ trần, 50 bộ lee mới..."
                  value={emptyFolderName}
                  onChange={(e) => setEmptyFolderName(e.target.value)}
                  autoFocus
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: 6 }}>
                  Thư mục này sẽ được tạo trực tiếp bên trong thư mục gốc ARI trên Google Drive.
                </span>
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: '0.9rem' }}
                disabled={isCreatingEmpty || !emptyFolderName.trim()}
              >
                {isCreatingEmpty ? (
                  <>
                    <Loader2 size={18} className="spinner" />
                    <span>Đang tạo trên Google Drive...</span>
                  </>
                ) : (
                  <>
                    <FolderPlus size={18} />
                    <span>Tạo Thư Mục Bộ Mới</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
