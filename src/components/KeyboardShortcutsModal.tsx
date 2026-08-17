'use client';

import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '1', desc: 'Đổi trạng thái bộ đang chọn thành Hoàn thành (_OK)' },
    { key: '2', desc: 'Đổi trạng thái bộ đang chọn thành Chờ 2-3 ngày (_2_3_DAY)' },
    { key: '3', desc: 'Đổi trạng thái bộ đang chọn thành Không được (_KO)' },
    { key: '0', desc: 'Khôi phục tên gốc của thư mục (Xóa hậu tố trạng thái)' },
    { key: 'Ctrl + S', desc: 'Lưu nội dung chỉnh sửa file text (.txt) lên Drive' },
    { key: '↑ / ↓', desc: 'Di chuyển chọn bộ hồ sơ trước / tiếp theo trong danh sách' },
    { key: 'Esc', desc: 'Đóng modal xem ảnh / bảng cài đặt' },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-container" 
        style={{ maxWidth: '540px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Keyboard size={18} color="#38bdf8" />
            <span>Phím tắt thao tác nhanh</span>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {shortcuts.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  {item.desc}
                </span>
                <kbd
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid var(--border-medium)',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#38bdf8',
                  }}
                >
                  {item.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
