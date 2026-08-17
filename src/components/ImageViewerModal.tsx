'use client';

import React, { useState, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Download, Maximize2, Move } from 'lucide-react';
import { DriveFile } from '@/lib/types';

interface ImageViewerModalProps {
  file: DriveFile | null;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ file, onClose }) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  if (!file) return null;

  const imageSrc = `/api/drive/proxy-image?fileId=${file.id}`;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.3, 5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.3, 0.4));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.88;
    setZoom((prev) => {
      const nextZoom = Math.min(Math.max(prev * zoomFactor, 0.4), 5);
      if (nextZoom <= 1 && prev <= 1) {
        setPosition({ x: 0, y: 0 });
      }
      return nextZoom;
    });
  };

  // Double click toggle zoom
  const handleDoubleClick = () => {
    if (zoom > 1) {
      handleReset();
    } else {
      setZoom(2.2);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-container" 
        style={{ maxWidth: '1080px', width: '95vw' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>{file.name}</span>
            {file.size && (
              <span className="count-tag">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            )}
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Move size={13} />
              Kéo chuột để di chuyển • Lăn chuột để phóng to
            </span>
          </div>
          <button className="btn-icon" onClick={onClose} title="Đóng (Esc)">
            <X size={18} />
          </button>
        </div>

        {/* Body / Interactive Image Canvas */}
        <div className="modal-body" style={{ padding: 12 }}>
          <div className="lightbox-viewer">
            <div 
              className="lightbox-img-wrapper" 
              style={{ 
                width: '100%', 
                height: '68vh', 
                minHeight: '450px',
                position: 'relative',
                overflow: 'hidden',
                cursor: isDragging ? 'grabbing' : zoom > 1 ? 'grab' : 'crosshair',
                userSelect: 'none',
                backgroundColor: '#020617',
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              onDoubleClick={handleDoubleClick}
            >
              <img
                src={imageSrc}
                alt={file.name}
                draggable={false}
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                  transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  pointerEvents: 'none',
                }}
              />
            </div>

            {/* Controls Bar */}
            <div className="lightbox-controls" style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)' }}>
              <button className="btn-icon" onClick={handleZoomOut} title="Thu nhỏ (Lăn chuột xuống)">
                <ZoomOut size={16} />
              </button>
              
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#38bdf8', minWidth: 50, textAlign: 'center' }}>
                {Math.round(zoom * 100)}%
              </span>
              
              <button className="btn-icon" onClick={handleZoomIn} title="Phóng to (Lăn chuột lên)">
                <ZoomIn size={16} />
              </button>
              
              <div style={{ width: 1, height: 18, background: 'var(--border-subtle)', margin: '0 4px' }} />
              
              <button className="btn-icon" onClick={handleRotate} title="Xoay 90°">
                <RotateCw size={16} />
              </button>
              
              <button className="btn-icon" onClick={handleReset} title="Đặt lại góc và vị trí ban đầu (Nhấp đúp chuột)">
                <Maximize2 size={16} />
              </button>
              
              <div style={{ width: 1, height: 18, background: 'var(--border-subtle)', margin: '0 4px' }} />
              
              <a 
                href={imageSrc} 
                target="_blank" 
                rel="noreferrer" 
                className="btn-icon" 
                download={file.name}
                title="Tải ảnh gốc về máy"
              >
                <Download size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
