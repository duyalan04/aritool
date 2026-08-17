'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  Maximize2, 
  Move, 
  Crop, 
  Copy, 
  Check, 
  Undo2, 
  RotateCcw,
  Sparkles,
  Scissors
} from 'lucide-react';
import { DriveFile } from '@/lib/types';

interface ImageViewerModalProps {
  file: DriveFile | null;
  onClose: () => void;
}

interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

type DragHandle = 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w' | null;

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ file, onClose }) => {
  // Navigation & Zoom State
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Cropping State
  const [isCropMode, setIsCropMode] = useState<boolean>(false);
  const [croppedImageSrc, setCroppedImageSrc] = useState<string | null>(null);
  const [cropBox, setCropBox] = useState<CropBox>({ x: 50, y: 50, width: 260, height: 180 });
  const [activeHandle, setActiveHandle] = useState<DragHandle>(null);
  const [cropDragStart, setCropDragStart] = useState<{ mouseX: number; mouseY: number; box: CropBox }>({
    mouseX: 0,
    mouseY: 0,
    box: { x: 0, y: 0, width: 0, height: 0 },
  });
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset when file changes
  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setIsCropMode(false);
    setCroppedImageSrc(null);
    setCopySuccess(false);
  }, [file?.id]);

  if (!file) return null;

  const originalSrc = `/api/drive/proxy-image?fileId=${file.id}`;
  const activeDisplaySrc = croppedImageSrc || originalSrc;

  // Zoom / Pan Handlers
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.3, 5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.3, 0.4));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  // Toggle Crop Mode
  const handleToggleCropMode = () => {
    if (!isCropMode) {
      // Enter crop mode: reset zoom & pan to ensure full visibility of the crop box
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setIsCropMode(true);

      // Initialize default centered crop box
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const boxW = Math.min(rect.width * 0.7, 360);
        const boxH = Math.min(rect.height * 0.6, 240);
        setCropBox({
          x: Math.max(20, (rect.width - boxW) / 2),
          y: Math.max(20, (rect.height - boxH) / 2),
          width: boxW,
          height: boxH,
        });
      }
    } else {
      setIsCropMode(false);
    }
  };

  // Mouse drag handlers for Zoom/Pan (when not in crop mode)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isCropMode) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isCropMode) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom (when not in crop mode)
  const handleWheel = (e: React.WheelEvent) => {
    if (isCropMode) return;
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
    if (isCropMode) return;
    if (zoom > 1) {
      handleReset();
    } else {
      setZoom(2.2);
    }
  };

  // --- Crop Box Mouse Drag & Resize Logic ---
  const handleCropMouseDown = (handle: DragHandle, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveHandle(handle);
    setCropDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      box: { ...cropBox },
    });
  };

  const handleCropMouseMove = useCallback((e: MouseEvent) => {
    if (!activeHandle || !containerRef.current) return;

    const deltaX = e.clientX - cropDragStart.mouseX;
    const deltaY = e.clientY - cropDragStart.mouseY;
    const orig = cropDragStart.box;
    const containerRect = containerRef.current.getBoundingClientRect();
    const maxW = containerRect.width;
    const maxH = containerRect.height;
    const minSize = 40;

    let newX = orig.x;
    let newY = orig.y;
    let newW = orig.width;
    let newH = orig.height;

    if (activeHandle === 'move') {
      newX = Math.max(0, Math.min(orig.x + deltaX, maxW - orig.width));
      newY = Math.max(0, Math.min(orig.y + deltaY, maxH - orig.height));
    } else {
      // Resizing with 8 handles
      if (activeHandle.includes('e')) {
        newW = Math.max(minSize, Math.min(orig.width + deltaX, maxW - orig.x));
      }
      if (activeHandle.includes('s')) {
        newH = Math.max(minSize, Math.min(orig.height + deltaY, maxH - orig.y));
      }
      if (activeHandle.includes('w')) {
        const potentialW = orig.width - deltaX;
        if (potentialW >= minSize && orig.x + deltaX >= 0) {
          newX = orig.x + deltaX;
          newW = potentialW;
        }
      }
      if (activeHandle.includes('n')) {
        const potentialH = orig.height - deltaY;
        if (potentialH >= minSize && orig.y + deltaY >= 0) {
          newY = orig.y + deltaY;
          newH = potentialH;
        }
      }
    }

    setCropBox({ x: newX, y: newY, width: newW, height: newH });
  }, [activeHandle, cropDragStart]);

  const handleCropMouseUp = useCallback(() => {
    setActiveHandle(null);
  }, []);

  useEffect(() => {
    if (activeHandle) {
      window.addEventListener('mousemove', handleCropMouseMove);
      window.addEventListener('mouseup', handleCropMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleCropMouseMove);
        window.removeEventListener('mouseup', handleCropMouseUp);
      };
    }
  }, [activeHandle, handleCropMouseMove, handleCropMouseUp]);

  // Execute Crop to High-Resolution Canvas
  const generateCroppedCanvas = (): HTMLCanvasElement | null => {
    if (!imgRef.current || !containerRef.current) return null;

    const img = imgRef.current;
    const container = containerRef.current;

    const containerRect = container.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();

    // Compute image placement relative to container
    const imgLeft = imgRect.left - containerRect.left;
    const imgTop = imgRect.top - containerRect.top;
    const imgWidth = imgRect.width;
    const imgHeight = imgRect.height;

    // Intersection between cropBox and displayed image
    const interLeft = Math.max(cropBox.x, imgLeft);
    const interTop = Math.max(cropBox.y, imgTop);
    const interRight = Math.min(cropBox.x + cropBox.width, imgLeft + imgWidth);
    const interBottom = Math.min(cropBox.y + cropBox.height, imgTop + imgHeight);

    if (interRight <= interLeft || interBottom <= interTop) {
      alert('Vùng chọn cắt nằm ngoài hình ảnh. Vui lòng kéo khung vào trong ảnh.');
      return null;
    }

    // Scale factors to original natural image resolution
    const scaleX = img.naturalWidth / imgWidth;
    const scaleY = img.naturalHeight / imgHeight;

    const cropSourceX = (interLeft - imgLeft) * scaleX;
    const cropSourceY = (interTop - imgTop) * scaleY;
    const cropSourceW = (interRight - interLeft) * scaleX;
    const cropSourceH = (interBottom - interTop) * scaleY;

    // Create high-res canvas
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(cropSourceW);
    canvas.height = Math.round(cropSourceH);

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Support rotation if rotated
    if (rotation !== 0) {
      // Apply rotation transformation if needed
      ctx.drawImage(
        img,
        cropSourceX,
        cropSourceY,
        cropSourceW,
        cropSourceH,
        0,
        0,
        canvas.width,
        canvas.height
      );
    } else {
      ctx.drawImage(
        img,
        cropSourceX,
        cropSourceY,
        cropSourceW,
        cropSourceH,
        0,
        0,
        canvas.width,
        canvas.height
      );
    }

    return canvas;
  };

  // Apply Crop into Preview
  const handleApplyCrop = () => {
    const canvas = generateCroppedCanvas();
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    setCroppedImageSrc(dataUrl);
    setIsCropMode(false);
  };

  // Copy Cropped Image directly to Clipboard
  const handleCopyToClipboard = async () => {
    const canvas = isCropMode ? generateCroppedCanvas() : null;
    if (!canvas && isCropMode) return;

    try {
      if (canvas) {
        canvas.toBlob(async (blob) => {
          if (blob) {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob }),
            ]);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2500);
          }
        }, 'image/png');
      } else if (croppedImageSrc) {
        // Fetch existing data URL and copy blob
        const res = await fetch(croppedImageSrc);
        const blob = await res.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2500);
      }
    } catch (err) {
      console.error('Copy to clipboard failed', err);
      alert('Không thể sao chép trực tiếp vào clipboard trình duyệt. Bạn có thể nhấn Tải ảnh về máy.');
    }
  };

  // Download Cropped Image
  const handleDownloadCropped = () => {
    let downloadUrl = activeDisplaySrc;
    if (isCropMode) {
      const canvas = generateCroppedCanvas();
      if (!canvas) return;
      downloadUrl = canvas.toDataURL('image/png');
    }

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `cropped_${file.name.replace(/\.[^/.]+$/, '')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Reset to Original Uncropped Image
  const handleResetToOriginal = () => {
    setCroppedImageSrc(null);
    setIsCropMode(false);
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-container" 
        style={{ maxWidth: '1100px', width: '96vw' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>{file.name}</span>
            {croppedImageSrc && (
              <span className="count-tag" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)' }}>
                Đã cắt ảnh ✂
              </span>
            )}
            {file.size && !croppedImageSrc && (
              <span className="count-tag">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            )}
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              {isCropMode ? (
                '✂ Kéo viền để chọn vùng cắt • Nhấn "Áp dụng cắt" hoặc "Sao chép"'
              ) : (
                <>
                  <Move size={13} /> Kéo chuột để di chuyển • Lăn chuột để phóng to
                </>
              )}
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
              ref={containerRef}
              className="lightbox-img-wrapper" 
              style={{ 
                width: '100%', 
                height: '68vh', 
                minHeight: '460px',
                position: 'relative',
                overflow: 'hidden',
                cursor: isCropMode ? 'default' : isDragging ? 'grabbing' : zoom > 1 ? 'grab' : 'crosshair',
                userSelect: 'none',
                backgroundColor: '#020617',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              onDoubleClick={handleDoubleClick}
            >
              <img
                ref={imgRef}
                src={activeDisplaySrc}
                alt={file.name}
                draggable={false}
                crossOrigin="anonymous"
                style={{
                  transform: isCropMode ? 'none' : `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                  transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  pointerEvents: 'none',
                }}
              />

              {/* Interactive Crop Box Overlay (when Crop Mode is Active) */}
              {isCropMode && (
                <div 
                  style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                  }}
                >
                  {/* Dark mask outside crop box */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: cropBox.y,
                      background: 'rgba(0, 0, 0, 0.65)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      top: cropBox.y + cropBox.height,
                      background: 'rgba(0, 0, 0, 0.65)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: cropBox.y,
                      bottom: (containerRef.current?.clientHeight || 500) - (cropBox.y + cropBox.height),
                      left: 0,
                      width: cropBox.x,
                      background: 'rgba(0, 0, 0, 0.65)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: cropBox.y,
                      bottom: (containerRef.current?.clientHeight || 500) - (cropBox.y + cropBox.height),
                      right: 0,
                      left: cropBox.x + cropBox.width,
                      background: 'rgba(0, 0, 0, 0.65)',
                    }}
                  />

                  {/* Active Crop Box Rect */}
                  <div
                    style={{
                      position: 'absolute',
                      left: cropBox.x,
                      top: cropBox.y,
                      width: cropBox.width,
                      height: cropBox.height,
                      border: '2px solid #38bdf8',
                      boxShadow: '0 0 0 1px rgba(0,0,0,0.5), 0 0 20px rgba(56, 189, 248, 0.3)',
                      pointerEvents: 'auto',
                      cursor: 'move',
                    }}
                    onMouseDown={(e) => handleCropMouseDown('move', e)}
                  >
                    {/* Grid lines (rule of thirds) */}
                    <div style={{ position: 'absolute', top: '33.33%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.25)' }} />
                    <div style={{ position: 'absolute', top: '66.66%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.25)' }} />
                    <div style={{ position: 'absolute', left: '33.33%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.25)' }} />
                    <div style={{ position: 'absolute', left: '66.66%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.25)' }} />

                    {/* Crop Dimension Badge */}
                    <div style={{ position: 'absolute', top: -24, left: 0, background: '#38bdf8', color: '#020617', padding: '2px 6px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 700 }}>
                      {Math.round(cropBox.width)} × {Math.round(cropBox.height)} px
                    </div>

                    {/* 8 Resize Handles */}
                    {/* Corners */}
                    <div className="crop-handle handle-nw" style={{ cursor: 'nwse-resize', top: -5, left: -5 }} onMouseDown={(e) => handleCropMouseDown('nw', e)} />
                    <div className="crop-handle handle-ne" style={{ cursor: 'nesw-resize', top: -5, right: -5 }} onMouseDown={(e) => handleCropMouseDown('ne', e)} />
                    <div className="crop-handle handle-se" style={{ cursor: 'nwse-resize', bottom: -5, right: -5 }} onMouseDown={(e) => handleCropMouseDown('se', e)} />
                    <div className="crop-handle handle-sw" style={{ cursor: 'nesw-resize', bottom: -5, left: -5 }} onMouseDown={(e) => handleCropMouseDown('sw', e)} />

                    {/* Edges */}
                    <div className="crop-handle handle-n" style={{ cursor: 'ns-resize', top: -5, left: '50%', transform: 'translateX(-50%)' }} onMouseDown={(e) => handleCropMouseDown('n', e)} />
                    <div className="crop-handle handle-s" style={{ cursor: 'ns-resize', bottom: -5, left: '50%', transform: 'translateX(-50%)' }} onMouseDown={(e) => handleCropMouseDown('s', e)} />
                    <div className="crop-handle handle-w" style={{ cursor: 'ew-resize', left: -5, top: '50%', transform: 'translateY(-50%)' }} onMouseDown={(e) => handleCropMouseDown('w', e)} />
                    <div className="crop-handle handle-e" style={{ cursor: 'ew-resize', right: -5, top: '50%', transform: 'translateY(-50%)' }} onMouseDown={(e) => handleCropMouseDown('e', e)} />
                  </div>
                </div>
              )}
            </div>

            {/* Controls & Cropping Toolbar */}
            <div className="lightbox-controls" style={{ padding: '8px 16px', background: 'rgba(15, 23, 42, 0.95)', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-medium)', gap: 8, display: 'flex', alignItems: 'center' }}>
              
              {!isCropMode ? (
                /* Standard Zoom/Pan Toolbar */
                <>
                  <button className="btn-icon" onClick={handleZoomOut} title="Thu nhỏ (Lăn chuột xuống)">
                    <ZoomOut size={16} />
                  </button>
                  
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#38bdf8', minWidth: 48, textAlign: 'center' }}>
                    {Math.round(zoom * 100)}%
                  </span>
                  
                  <button className="btn-icon" onClick={handleZoomIn} title="Phóng to (Lăn chuột lên)">
                    <ZoomIn size={16} />
                  </button>
                  
                  <div style={{ width: 1, height: 18, background: 'var(--border-subtle)', margin: '0 4px' }} />
                  
                  <button className="btn-icon" onClick={handleRotate} title="Xoay 90°">
                    <RotateCw size={16} />
                  </button>
                  
                  <button className="btn-icon" onClick={handleReset} title="Đặt lại kích thước ban đầu (Nhấp đúp chuột)">
                    <Maximize2 size={16} />
                  </button>

                  <div style={{ width: 1, height: 18, background: 'var(--border-subtle)', margin: '0 4px' }} />

                  {/* Crop Image Button */}
                  <button 
                    className="btn-primary" 
                    style={{ padding: '6px 14px', fontSize: '0.8rem', gap: 6, background: 'linear-gradient(135deg, #0284c7, #38bdf8)', color: '#020617', fontWeight: 700 }}
                    onClick={handleToggleCropMode}
                    title="Mở công cụ cắt vùng ảnh / passport"
                  >
                    <Crop size={15} />
                    <span>Cắt ảnh</span>
                  </button>

                  {/* If image is already cropped, show copy and reset buttons */}
                  {croppedImageSrc && (
                    <>
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '0.8rem', gap: 6, borderColor: copySuccess ? '#10b981' : undefined, color: copySuccess ? '#34d399' : undefined }}
                        onClick={handleCopyToClipboard}
                        title="Sao chép ảnh đã cắt vào clipboard (để paste vào Zalo, Telegram, Word)"
                      >
                        {copySuccess ? <Check size={15} /> : <Copy size={15} />}
                        <span>{copySuccess ? 'Đã Copy!' : 'Copy'}</span>
                      </button>

                      <button 
                        className="btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '0.8rem', gap: 6 }}
                        onClick={handleDownloadCropped}
                        title="Tải ảnh đã cắt về máy"
                      >
                        <Download size={15} />
                        <span>Tải ảnh cắt</span>
                      </button>

                      <button 
                        className="btn-icon" 
                        onClick={handleResetToOriginal}
                        title="Khôi phục ảnh gốc ban đầu"
                      >
                        <RotateCcw size={16} />
                      </button>
                    </>
                  )}

                  {!croppedImageSrc && (
                    <a 
                      href={originalSrc} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="btn-icon" 
                      download={file.name}
                      title="Tải ảnh gốc về máy"
                    >
                      <Download size={16} />
                    </a>
                  )}
                </>
              ) : (
                /* Cropping Mode Action Bar */
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 6 }}>
                    <Scissors size={16} color="#38bdf8" />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#38bdf8' }}>
                      Đang chọn vùng cắt:
                    </span>
                  </div>

                  {/* Apply Crop */}
                  <button 
                    className="btn-primary" 
                    style={{ padding: '6px 14px', fontSize: '0.8rem', gap: 6, background: '#10b981', borderColor: '#059669', color: 'white', fontWeight: 700 }}
                    onClick={handleApplyCrop}
                    title="Xác nhận cắt vùng đã chọn"
                  >
                    <Check size={15} />
                    <span>Áp dụng cắt</span>
                  </button>

                  {/* Copy directly */}
                  <button 
                    className="btn-secondary" 
                    style={{ padding: '6px 14px', fontSize: '0.8rem', gap: 6, borderColor: copySuccess ? '#10b981' : undefined, color: copySuccess ? '#34d399' : undefined }}
                    onClick={handleCopyToClipboard}
                    title="Cắt và sao chép trực tiếp vào khay nhớ tạm (Ctrl+V dán ngay)"
                  >
                    {copySuccess ? <Check size={15} /> : <Copy size={15} />}
                    <span>{copySuccess ? 'Đã Copy Clipboard!' : 'Cắt & Copy'}</span>
                  </button>

                  {/* Download cropped directly */}
                  <button 
                    className="btn-secondary" 
                    style={{ padding: '6px 12px', fontSize: '0.8rem', gap: 6 }}
                    onClick={handleDownloadCropped}
                    title="Cắt và tải ngay file PNG về máy"
                  >
                    <Download size={15} />
                    <span>Cắt & Tải về</span>
                  </button>

                  <div style={{ width: 1, height: 18, background: 'var(--border-subtle)', margin: '0 4px' }} />

                  {/* Cancel Crop */}
                  <button 
                    className="btn-icon" 
                    onClick={() => setIsCropMode(false)}
                    title="Hủy chế độ cắt (Hủy)"
                  >
                    <Undo2 size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
