'use client';

import React from 'react';
import { 
  Folder, 
  FolderOpen, 
  Search, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  HelpCircle,
  Layers,
  Filter
} from 'lucide-react';
import { DriveFolder, FolderStatus } from '@/lib/types';

interface SidebarProps {
  batches: DriveFolder[];
  selectedBatch: DriveFolder | null;
  onSelectBatch: (batch: DriveFolder) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: FolderStatus | 'ALL';
  onStatusFilterChange: (status: FolderStatus | 'ALL') => void;
  counts: {
    all: number;
    pending: number;
    ok: number;
    twoThreeDay: number;
    ko: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  batches,
  selectedBatch,
  onSelectBatch,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  counts,
}) => {
  // Calculate progress percentage
  const total = counts.all || 1;
  const okPercent = Math.round((counts.ok / total) * 100);
  const waitPercent = Math.round((counts.twoThreeDay / total) * 100);
  const koPercent = Math.round((counts.ko / total) * 100);

  return (
    <aside className="column-panel sidebar-panel">
      {/* Column Header */}
      <div className="column-header">
        <div className="column-title">
          <Layers size={16} color="#38bdf8" />
          <span>Danh sách Bộ (Batches)</span>
        </div>
        <span className="count-tag">{batches.length} bộ</span>
      </div>

      {/* Search Bar */}
      <div className="search-box-wrapper">
        <div className="search-input-group">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Tìm kiếm bộ / tên khách..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="sidebar-scrollable">
        {/* Batches Tree */}
        <div>
          <div className="sidebar-section-title">Thư mục Bộ trong ARI</div>
          <div className="batch-list">
            {batches.length === 0 ? (
              <div style={{ padding: '14px 8px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                Chưa có thư mục nào từ Google Drive.
              </div>
            ) : (
              batches.map((batch) => {
                const isSelected = selectedBatch?.id === batch.id;
                return (
                  <div
                    key={batch.id}
                    className={`batch-item ${isSelected ? 'active' : ''}`}
                    onClick={() => onSelectBatch(batch)}
                  >
                    <div className="batch-item-info">
                      {isSelected ? (
                        <FolderOpen size={18} color="#38bdf8" />
                      ) : (
                        <Folder size={18} color="#94a3b8" />
                      )}
                      <span>{batch.name}</span>
                    </div>
                    {batch.childrenCount !== undefined && (
                      <span className="count-tag">{batch.childrenCount}</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Status Filters */}
        <div>
          <div className="sidebar-section-title">
            <Filter size={12} style={{ display: 'inline', marginRight: 4 }} />
            Lọc theo Trạng thái
          </div>
          <div className="filter-list">
            {/* All */}
            <div
              className={`filter-item ${statusFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => onStatusFilterChange('ALL')}
            >
              <div className="filter-label-group">
                <span className="filter-indicator" style={{ backgroundColor: '#94a3b8' }} />
                <span>Tất cả</span>
              </div>
              <span className="filter-badge">{counts.all}</span>
            </div>

            {/* Pending / Chưa làm */}
            <div
              className={`filter-item ${statusFilter === 'NONE' ? 'active' : ''}`}
              onClick={() => onStatusFilterChange('NONE')}
            >
              <div className="filter-label-group">
                <span className="filter-indicator" style={{ backgroundColor: '#64748b' }} />
                <span>Chưa xử lý (Gốc)</span>
              </div>
              <span className="filter-badge">{counts.pending}</span>
            </div>

            {/* Done _OK */}
            <div
              className={`filter-item ${statusFilter === 'OK' ? 'active' : ''}`}
              onClick={() => onStatusFilterChange('OK')}
            >
              <div className="filter-label-group">
                <span className="filter-indicator" style={{ backgroundColor: 'var(--status-ok)' }} />
                <span>Hoàn thành (_OK)</span>
              </div>
              <span className="filter-badge" style={{ color: 'var(--status-ok)', fontWeight: 700 }}>
                {counts.ok}
              </span>
            </div>

            {/* 2-3 Day */}
            <div
              className={`filter-item ${statusFilter === '2_3_DAY' ? 'active' : ''}`}
              onClick={() => onStatusFilterChange('2_3_DAY')}
            >
              <div className="filter-label-group">
                <span className="filter-indicator" style={{ backgroundColor: 'var(--status-wait)' }} />
                <span>Chờ 2-3 ngày (_2_3_DAY)</span>
              </div>
              <span className="filter-badge" style={{ color: 'var(--status-wait)', fontWeight: 700 }}>
                {counts.twoThreeDay}
              </span>
            </div>

            {/* KO */}
            <div
              className={`filter-item ${statusFilter === 'KO' ? 'active' : ''}`}
              onClick={() => onStatusFilterChange('KO')}
            >
              <div className="filter-label-group">
                <span className="filter-indicator" style={{ backgroundColor: 'var(--status-ko)' }} />
                <span>Không được (_KO)</span>
              </div>
              <span className="filter-badge" style={{ color: 'var(--status-ko)', fontWeight: 700 }}>
                {counts.ko}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="stats-card">
          <div className="stats-header">
            <span className="stats-title">Tiến độ Bộ hiện tại</span>
            <span className="stats-percent">{okPercent}% Xong</span>
          </div>

          {/* Multi-segment Progress Bar */}
          <div className="progress-bar-track">
            <div className="progress-bar-ok" style={{ width: `${okPercent}%` }} />
            <div className="progress-bar-wait" style={{ width: `${waitPercent}%` }} />
            <div className="progress-bar-ko" style={{ width: `${koPercent}%` }} />
          </div>

          <div className="stats-mini-grid">
            <div className="mini-stat-box">
              <div className="mini-stat-num" style={{ color: 'var(--status-ok)' }}>{counts.ok}</div>
              <div className="mini-stat-lbl">Xong</div>
            </div>
            <div className="mini-stat-box">
              <div className="mini-stat-num" style={{ color: 'var(--status-wait)' }}>{counts.twoThreeDay}</div>
              <div className="mini-stat-lbl">Chờ 2-3d</div>
            </div>
            <div className="mini-stat-box">
              <div className="mini-stat-num" style={{ color: 'var(--status-ko)' }}>{counts.ko}</div>
              <div className="mini-stat-lbl">Lỗi / KO</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
