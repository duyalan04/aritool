'use client';

import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Download, Maximize2 } from 'lucide-react';
import { DriveFile } from '@/lib/types';

interface ImageViewerModalProps {
  file: DriveFile | null;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ file, onClose }) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  if (!file) return null;

  const imageSrc = `/api/drive/proxy-image?fileId=${file.id}`;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-container" 
        style={{ maxWidth: '1000px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{file.name}</span>
            {file.size && (
              <span className="count-tag">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            )}
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body / Image Preview */}
        <div className="modal-body">
          <div className="lightbox-viewer">
            <div className="lightbox-img-wrapper" style={{ width: '100%', minHeight: '400px' }}>
              <img
                src={imageSrc}
                alt={file.name}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  maxWidth: '100%',
                  maxHeight: '65vh',
                  objectFit: 'contain',
                }}
              />
            </div>

            {/* Controls */}
            <div className="lightbox-controls">
              <button className="btn-icon" onClick={handleZoomOut} title="Thu nhỏ">
                <ZoomOut size={16} />
              </button>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', minWidth: 45, textAlign: 'center' }}>
                {Math.round(zoom * 100)}%
              </span>
              <button className="btn-icon" onClick={handleZoomIn} title="Phóng to">
                <ZoomIn size={16} />
              </button>
              <button className="btn-icon" onClick={handleRotate} title="Xoay 90°">
                <RotateCw size={16} />
              </button>
              <button className="btn-icon" onClick={handleReset} title="Đặt lại gốc">
                <Maximize2 size={16} />
              </button>
              {file.webContentLink && (
                <a 
                  href={file.webContentLink} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn-icon" 
                  download={file.name}
                  title="Tải ảnh gốc về máy"
                >
                  <Download size={16} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
