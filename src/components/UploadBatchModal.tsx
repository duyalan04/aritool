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
  Sparkles
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

interface FileWithRelativePath {
  file: File;
  relativePath: string;
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
  const [isDragOver, setIsDragOver] = useState(false);
  const [isReadingFolder, setIsReadingFolder] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Process standard file input selection
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList: FileWithRelativePath[] = Array.from(files).map((f) => ({
      file: f,
      relativePath: f.webkitRelativePath || f.name,
    }));

    processFileList(fileList);
  };

  // Traverse dropped directory tree recursively
  const traverseEntry = async (
    entry: any,
    path: string,
    collected: FileWithRelativePath[]
  ) => {
    if (!entry) return;

    if (entry.isFile) {
      await new Promise<void>((resolve) => {
        entry.file(
          (file: File) => {
            collected.push({
              file,
              relativePath: path + file.name,
            });
            resolve();
          },
          () => resolve()
        );
      });
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader();
      const readAllEntries = async () => {
        const entries: any[] = await new Promise((resolve) => {
          dirReader.readEntries(
            (results: any[]) => resolve(results || []),
            () => resolve([])
          );
        });

        if (entries.length > 0) {
          for (const child of entries) {
            await traverseEntry(child, path + entry.name + '/', collected);
          }
          // Continue reading if there are more entries in this directory
          await readAllEntries();
        }
      };
      await readAllEntries();
    }
  };

  // Handle Drag & Drop of Folder / Files
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (isUploading) return;

    try {
      setIsReadingFolder(true);
      setErrorMessage('');

      const items = e.dataTransfer.items;
      const collected: FileWithRelativePath[] = [];

      if (items && items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const entry = (item as any).webkitGetAsEntry ? (item as any).webkitGetAsEntry() : null;
          if (entry) {
            await traverseEntry(entry, '', collected);
          } else {
            const f = item.getAsFile();
            if (f) {
              collected.push({ file: f, relativePath: f.name });
            }
          }
        }
      } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          const f = e.dataTransfer.files[i];
          collected.push({
            file: f,
            relativePath: (f as any).webkitRelativePath || f.name,
          });
        }
      }

      if (collected.length === 0) {
        setErrorMessage('Không tìm thấy tệp tin hoặc thư mục hợp lệ khi kéo thả.');
        return;
      }

      processFileList(collected);
    } catch (err: any) {
      console.error('Error parsing dropped files:', err);
      setErrorMessage('Lỗi khi đọc thư mục kéo thả: ' + err.message);
    } finally {
      setIsReadingFolder(false);
    }
  };

  // Group files by root folder and subfolder hierarchy
  const processFileList = (items: FileWithRelativePath[]) => {
    setErrorMessage('');
    setIsSuccess(false);

    let rootName = '';
    const subfolders: { [name: string]: File[] } = {};
    let totalFiles = 0;

    for (const item of items) {
      const parts = item.relativePath.split('/').filter(Boolean);

      if (parts.length >= 3) {
        // e.g. "30 bộ lee/VANESSA PADILLA/5.png"
        rootName = parts[0];
        const subfolderName = parts[1];

        if (!subfolders[subfolderName]) {
          subfolders[subfolderName] = [];
        }
        subfolders[subfolderName].push(item.file);
        totalFiles++;
      } else if (parts.length === 2) {
        // e.g. "30 bộ lee/VANESSA PADILLA" (if files directly under subfolder or single folder dropped)
        if (!rootName) rootName = parts[0];
        const subfolderName = parts[0];
        if (!subfolders[subfolderName]) {
          subfolders[subfolderName] = [];
        }
        subfolders[subfolderName].push(item.file);
        totalFiles++;
      } else {
        // Direct files (parts.length === 1)
        const defName = 'Bộ Hồ Sơ Mới';
        if (!rootName) rootName = defName;
        if (!subfolders['Hồ sơ']) subfolders['Hồ sơ'] = [];
        subfolders['Hồ sơ'].push(item.file);
        totalFiles++;
      }
    }

    if (!rootName || totalFiles === 0) {
      setErrorMessage('Không nhận diện được cấu trúc thư mục. Vui lòng chọn hoặc kéo thả cả thư mục bộ.');
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
            <button className="btn-icon" onClick={onClose} title="Đóng (Esc)">
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
            <span>Tải lên / Kéo thả Thư mục Bộ</span>
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
                /* Dropzone Area with Drag & Drop Event Listeners */
                <div 
                  className="upload-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  style={{
                    border: isDragOver ? '2px dashed #38bdf8' : '2px dashed var(--border-medium)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '40px 20px',
                    textAlign: 'center',
                    background: isDragOver ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    transform: isDragOver ? 'scale(1.02)' : 'none',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: isDragOver ? '0 0 24px rgba(56, 189, 248, 0.35)' : 'none',
                  }}
                >
                  <div style={{ 
                    width: 58, 
                    height: 58, 
                    borderRadius: '50%', 
                    background: isDragOver ? '#38bdf8' : 'rgba(56, 189, 248, 0.12)', 
                    color: isDragOver ? '#020617' : '#38bdf8', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '0 auto 16px',
                    transition: 'all 0.2s ease'
                  }}>
                    {isReadingFolder ? (
                      <Loader2 size={30} className="spinner" />
                    ) : (
                      <UploadCloud size={30} />
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: isDragOver ? '#38bdf8' : 'var(--text-primary)', marginBottom: 8 }}>
                    {isReadingFolder ? 'Đang đọc cây thư mục kéo thả...' : isDragOver ? 'Thả thư mục bộ vào đây ngay!' : 'Kéo & Thả Thư mục Bộ vào đây'}
                  </h3>
                  
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 18px', lineHeight: 1.5 }}>
                    Kéo thả trực tiếp cả thư mục từ máy tính (ví dụ: <code style={{ color: '#93c5fd' }}>30 bộ lee</code>) hoặc bấm nút bên dưới để duyệt thư mục.
                  </p>

                  <button 
                    type="button" 
                    className="btn-primary" 
                    style={{ margin: '0 auto', pointerEvents: 'none' }}
                  >
                    <span>Hoặc Bấm để Duyệt Thư mục...</span>
                  </button>
                </div>
              ) : (
                /* Parsed Summary & Upload Execution */
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Folder size={24} color="#38bdf8" />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                          {parsedBatch.rootName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Sẽ được tạo trong thư mục ARI trên Google Drive
                        </div>
                      </div>
                    </div>
                    {!isUploading && !isSuccess && (
                      <button className="btn-secondary" style={{ padding: '5px 12px', fontSize: '0.75rem' }} onClick={handleReset}>
                        Đổi thư mục khác
                      </button>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
                    <div style={{ background: 'rgba(0,0,0,0.25)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Layers size={14} color="#38bdf8" /> Số bộ con tìm thấy
                      </div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#38bdf8', marginTop: 4 }}>
                        {Object.keys(parsedBatch.subfolders).length} bộ
                      </div>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.25)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FileText size={14} color="#34d399" /> Tổng số tệp tin
                      </div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#34d399', marginTop: 4 }}>
                        {parsedBatch.totalFiles} files
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar (when uploading) */}
                  {isUploading && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                        <span>Tiến độ tải lên Google Drive</span>
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
                      style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: '0.92rem' }}
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
