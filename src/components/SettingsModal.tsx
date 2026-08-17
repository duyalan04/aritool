'use client';

import React from 'react';
import { X, Key, HardDrive, CheckCircle2, AlertCircle, Copy, ExternalLink, HelpCircle } from 'lucide-react';
import { DriveConnectionStatus } from '@/lib/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectionStatus: DriveConnectionStatus | null;
  onTestConnection: () => void;
  isTesting: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  connectionStatus,
  onTestConnection,
  isTesting,
}) => {
  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Đã sao chép vào clipboard!');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-container" 
        style={{ maxWidth: '680px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Key size={18} color="#38bdf8" />
            <span>Cài đặt & Kết nối Google Drive</span>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Current Connection Status Box */}
          <div 
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                Trạng thái hiện tại:
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {connectionStatus?.connected ? (
                  <span style={{ color: 'var(--status-ok)', fontWeight: 600 }}>✓ Đã kết nối thành công với Google Drive</span>
                ) : (
                  <span style={{ color: 'var(--status-ko)' }}>✕ {connectionStatus?.error || 'Chưa kết nối Google Drive'}</span>
                )}
              </div>
              {connectionStatus?.rootFolderId && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Root Folder ID: <code>{connectionStatus.rootFolderId}</code>
                </div>
              )}
            </div>

            <button 
              className="btn-primary" 
              onClick={onTestConnection}
              disabled={isTesting}
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              {isTesting ? 'Đang kiểm tra...' : 'Kiểm tra lại'}
            </button>
          </div>

          {/* Setup Guide for Vercel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#38bdf8' }}>
              🚀 Hướng dẫn kết nối Google Drive khi Deploy lên Vercel:
            </div>

            <div style={{ fontSize: '0.84rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              Để ứng dụng đọc và ghi trực tiếp vào Google Drive của bạn khi đưa lên Vercel:
            </div>

            <ol style={{ paddingLeft: 20, fontSize: '0.82rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
              <li>
                Truy cập <strong>Google Cloud Console</strong> &gt; Tạo <strong>Service Account</strong> &gt; Tạo khóa dạng <strong>JSON Key</strong>.
              </li>
              <li>
                Mở thư mục <strong>ARI</strong> trên Google Drive của bạn &gt; Bấm nút <strong>Chia sẻ (Share)</strong> &gt; Thêm email của Service Account với quyền <strong>Người chỉnh sửa (Editor)</strong>.
              </li>
              <li>
                Trên Dashboard của <strong>Vercel</strong> (hoặc file <code>.env.local</code> ở máy), thêm 2 biến môi trường:
              </li>
            </ol>

            {/* Env Vars Code Box */}
            <div 
              style={{
                background: '#020617',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                fontFamily: 'monospace',
                fontSize: '0.78rem',
                color: '#38bdf8',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <code>GOOGLE_SERVICE_ACCOUNT_KEY=&#123;&quot;type&quot;:&quot;service_account&quot;,...&#125;</code>
                <button 
                  className="btn-icon" 
                  style={{ width: 26, height: 26 }} 
                  onClick={() => copyToClipboard('GOOGLE_SERVICE_ACCOUNT_KEY')}
                  title="Copy tên biến"
                >
                  <Copy size={12} />
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <code>GOOGLE_DRIVE_ROOT_FOLDER_ID=1QjVV2u_aiNPriykD1ixD1_h77sb7wUPh</code>
                <button 
                  className="btn-icon" 
                  style={{ width: 26, height: 26 }} 
                  onClick={() => copyToClipboard('GOOGLE_DRIVE_ROOT_FOLDER_ID')}
                  title="Copy tên biến"
                >
                  <Copy size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
