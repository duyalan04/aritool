'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { SubfolderList } from '@/components/SubfolderList';
import { ContentViewer } from '@/components/ContentViewer';
import { SettingsModal } from '@/components/SettingsModal';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { DriveFolder, DriveFile, FolderStatus, DriveConnectionStatus } from '@/lib/types';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface ToastInfo {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function Home() {
  // State: Connection & Navigation
  const [connectionStatus, setConnectionStatus] = useState<DriveConnectionStatus | null>(null);
  const [batches, setBatches] = useState<DriveFolder[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<DriveFolder | null>(null);
  
  // State: Subfolders & Selection
  const [subfolders, setSubfolders] = useState<DriveFolder[]>([]);
  const [selectedSubfolder, setSelectedSubfolder] = useState<DriveFolder | null>(null);

  // State: Files & Editor
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [activeTextContent, setActiveTextContent] = useState<string>('');
  
  // State: Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<FolderStatus | 'ALL'>('ALL');

  // State: Modals & Loading
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [loadingFolderId, setLoadingFolderId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  // Toast Helper
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // 1. Fetch Connection Status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/drive/status');
      const data: DriveConnectionStatus = await res.json();
      setConnectionStatus(data);
    } catch (err) {
      console.error('Failed to fetch drive status', err);
    }
  }, []);

  // 2. Fetch Batches (Root subfolders like "30 bộ lee")
  const fetchBatches = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/drive/batches');
      const data = await res.json();
      if (data.success && data.batches) {
        setBatches(data.batches);
        // Auto-select first batch if none selected
        if (data.batches.length > 0 && !selectedBatch) {
          setSelectedBatch(data.batches[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch batches', err);
      showToast('Lỗi khi tải danh sách bộ', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedBatch, showToast]);

  // 3. Fetch Subfolders for Selected Batch
  const fetchSubfolders = useCallback(async (batchId: string) => {
    try {
      const res = await fetch(`/api/drive/subfolders?batchId=${batchId}`);
      const data = await res.json();
      if (data.success && data.subfolders) {
        setSubfolders(data.subfolders);
        // Auto select first subfolder if valid
        if (data.subfolders.length > 0) {
          setSelectedSubfolder(data.subfolders[0]);
        } else {
          setSelectedSubfolder(null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch subfolders', err);
      showToast('Lỗi khi tải danh sách bộ con', 'error');
    }
  }, [showToast]);

  // 4. Fetch Files for Selected Subfolder
  const fetchFiles = useCallback(async (folderId: string) => {
    setIsLoadingFiles(true);
    try {
      const res = await fetch(`/api/drive/files?folderId=${folderId}`);
      const data = await res.json();
      if (data.success && data.files) {
        setFiles(data.files);
        
        // Find text file and fetch its content
        const textFile = data.files.find((f: DriveFile) => f.isText);
        if (textFile) {
          const textRes = await fetch(`/api/drive/file-content?fileId=${textFile.id}`);
          const textData = await textRes.json();
          if (textData.success) {
            setActiveTextContent(textData.content || '');
          }
        } else {
          setActiveTextContent('');
        }
      }
    } catch (err) {
      console.error('Failed to fetch files', err);
      showToast('Lỗi khi tải files trong thư mục', 'error');
    } finally {
      setIsLoadingFiles(false);
    }
  }, [showToast]);

  // Initial load
  useEffect(() => {
    fetchStatus();
    fetchBatches();
  }, [fetchStatus, fetchBatches]);

  // When selectedBatch changes, load subfolders
  useEffect(() => {
    if (selectedBatch) {
      fetchSubfolders(selectedBatch.id);
    }
  }, [selectedBatch, fetchSubfolders]);

  // When selectedSubfolder changes, load files
  useEffect(() => {
    if (selectedSubfolder) {
      fetchFiles(selectedSubfolder.id);
    } else {
      setFiles([]);
      setActiveTextContent('');
    }
  }, [selectedSubfolder, fetchFiles]);

  // Handle Status Update (_OK, _2_3_DAY, _KO, NONE)
  const handleUpdateStatus = async (folderId: string, targetStatus: FolderStatus) => {
    setLoadingFolderId(folderId);
    try {
      const res = await fetch('/api/drive/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId, status: targetStatus }),
      });

      const data = await res.json();
      if (data.success) {
        // Update subfolders in local state
        setSubfolders((prev) =>
          prev.map((f) =>
            f.id === folderId
              ? { ...f, name: data.newName, cleanName: data.cleanName, status: data.status }
              : f
          )
        );

        // Update selected subfolder if it matches
        if (selectedSubfolder?.id === folderId) {
          setSelectedSubfolder((prev) =>
            prev ? { ...prev, name: data.newName, cleanName: data.cleanName, status: data.status } : null
          );
        }

        const statusLabel =
          targetStatus === 'OK'
            ? '✓ Hoàn thành (_OK)'
            : targetStatus === '2_3_DAY'
            ? '⏳ Chờ 2-3 ngày (_2_3_DAY)'
            : targetStatus === 'KO'
            ? '✕ Không được (_KO)'
            : '↺ Khôi phục gốc';

        showToast(`Đã cập nhật: ${data.newName} (${statusLabel})`, 'success');
      } else {
        showToast(data.error || 'Lỗi khi cập nhật trạng thái', 'error');
      }
    } catch (err: any) {
      console.error('Error updating status:', err);
      showToast(err.message || 'Lỗi cập nhật trạng thái', 'error');
    } finally {
      setLoadingFolderId(null);
    }
  };

  // Handle Save Text File Content
  const handleSaveText = async (fileId: string, content: string) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/drive/file-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, content }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('✓ Đã lưu nội dung file .txt thành công lên Google Drive!', 'success');
      } else {
        showToast(data.error || 'Lỗi khi lưu file text', 'error');
      }
    } catch (err: any) {
      console.error('Error saving text:', err);
      showToast(err.message || 'Lỗi khi lưu file', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter and Search logic
  const filteredSubfolders = useMemo(() => {
    return subfolders.filter((folder) => {
      // Match status filter
      if (statusFilter !== 'ALL' && folder.status !== statusFilter) {
        return false;
      }
      // Match search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          folder.cleanName.toLowerCase().includes(q) ||
          folder.name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [subfolders, statusFilter, searchQuery]);

  // Compute status counts for the active batch
  const counts = useMemo(() => {
    const res = {
      all: subfolders.length,
      pending: 0,
      ok: 0,
      twoThreeDay: 0,
      ko: 0,
    };
    subfolders.forEach((f) => {
      if (f.status === 'OK') res.ok += 1;
      else if (f.status === '2_3_DAY') res.twoThreeDay += 1;
      else if (f.status === 'KO') res.ko += 1;
      else res.pending += 1;
    });
    return res;
  }, [subfolders]);

  // Keyboard Shortcuts (1: OK, 2: 2_3_DAY, 3: KO, 0: NONE, ArrowUp, ArrowDown)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't trigger status shortcuts if user is typing in textarea or search input
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        return;
      }

      if (!selectedSubfolder) return;

      if (e.key === '1') {
        e.preventDefault();
        handleUpdateStatus(selectedSubfolder.id, 'OK');
      } else if (e.key === '2') {
        e.preventDefault();
        handleUpdateStatus(selectedSubfolder.id, '2_3_DAY');
      } else if (e.key === '3') {
        e.preventDefault();
        handleUpdateStatus(selectedSubfolder.id, 'KO');
      } else if (e.key === '0') {
        e.preventDefault();
        handleUpdateStatus(selectedSubfolder.id, 'NONE');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const currentIndex = filteredSubfolders.findIndex((f) => f.id === selectedSubfolder.id);
        if (currentIndex < filteredSubfolders.length - 1) {
          setSelectedSubfolder(filteredSubfolders[currentIndex + 1]);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = filteredSubfolders.findIndex((f) => f.id === selectedSubfolder.id);
        if (currentIndex > 0) {
          setSelectedSubfolder(filteredSubfolders[currentIndex - 1]);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [selectedSubfolder, filteredSubfolders]);

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        connectionStatus={connectionStatus}
        selectedBatch={selectedBatch}
        selectedSubfolder={selectedSubfolder}
        onSelectBatch={(batch) => {
          setSelectedBatch(batch);
          setSelectedSubfolder(null);
        }}
        onRefresh={() => {
          fetchStatus();
          fetchBatches();
          if (selectedBatch) fetchSubfolders(selectedBatch.id);
          if (selectedSubfolder) fetchFiles(selectedSubfolder.id);
          showToast('Đã làm mới dữ liệu!', 'info');
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        isLoading={isLoading}
      />

      {/* 3-Column Workspace */}
      <div className="main-workspace">
        {/* Column 1: Sidebar with Batches and Status Filters */}
        <Sidebar
          batches={batches}
          selectedBatch={selectedBatch}
          onSelectBatch={(batch) => {
            setSelectedBatch(batch);
            setSelectedSubfolder(null);
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          counts={counts}
        />

        {/* Column 2: Subfolder List with 1-Click Status Buttons */}
        <SubfolderList
          subfolders={filteredSubfolders}
          selectedSubfolder={selectedSubfolder}
          onSelectSubfolder={(folder) => setSelectedSubfolder(folder)}
          onUpdateStatus={handleUpdateStatus}
          loadingFolderId={loadingFolderId}
        />

        {/* Column 3: Content Viewer (Text Editor & Image Gallery) */}
        <ContentViewer
          selectedFolder={selectedSubfolder}
          files={files}
          activeTextContent={activeTextContent}
          onTextContentChange={setActiveTextContent}
          onSaveText={handleSaveText}
          onUpdateStatus={handleUpdateStatus}
          isSaving={isSaving}
          isLoadingFiles={isLoadingFiles}
        />
      </div>

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast ${
              t.type === 'success' ? 'toast-success' : t.type === 'error' ? 'toast-error' : ''
            }`}
          >
            {t.type === 'success' && <CheckCircle2 size={16} />}
            {t.type === 'error' && <AlertCircle size={16} />}
            {t.type === 'info' && <Info size={16} />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        connectionStatus={connectionStatus}
        onTestConnection={async () => {
          await fetchStatus();
          showToast('Đã kiểm tra kết nối Google Drive!', 'info');
        }}
        isTesting={isLoading}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
