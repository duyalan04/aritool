'use client';

import React, { useState, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Copy, 
  Check, 
  Settings2,
  Trash2,
  ArrowRight,
  User,
  FolderArchive,
  Info
} from 'lucide-react';
import JSZip from 'jszip';
import { parseRawCsvText, ParsedRecord, DobFormat } from '@/lib/csv-parser';
import { DriveFolder } from '@/lib/types';

interface AutoSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (createdBatch?: DriveFolder) => void;
  parentFolderId?: string;
}

const SAMPLE_CSV = `SSN,NAME,DOB(YYYY-MM-DD),ADDRESS,CITY,STATE,ZIP,PRICE,BASENAME,PHONES,EMAIL,DL_NUM
613438939,BROOKYLN DAVIS M,2002-01-16,395 JONES DR,LAKE HAVASU CITY,AZ,86406,0.25,xilo,9284863234,N/A,N/A
625376952,ROSA BRAUNSTEIN D,2002-01-16,10348 N 99TH ST,SCOTTSDALE,AZ,85258,0.25,xilo,4803292995,N/A,N/A
764169687,JOSHUA WHITE S,2002-01-18,1930 N COUNTRY CLUB DR APT 2004,MESA,AZ,85201-1786,0.25,xilo,N/A,N/A,N/A
606312198,TAYLOR JOHNSON M,2002-01-19,3005 W BEAUTIFUL LN,LAVEEN,AZ,85339,0.25,xilo,N/A,N/A,N/A
769093297,ALANNA KATES LYNN,2002-01-19,3753 W ANGELA DR,GLENDALE,AZ,85308,0.25,xilo,N/A,N/A,N/A`;

export const AutoSplitModal: React.FC<AutoSplitModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [rawText, setRawText] = useState<string>('');
  const [batchName, setBatchName] = useState<string>('40 bộ mới');
  const [dobFormat, setDobFormat] = useState<DobFormat>('M/D/YYYY');
  const [includePhone, setIncludePhone] = useState<boolean>(true);
  const [fileName, setFileName] = useState<string>('New Text Document.txt');
  
  const [selectedRecordForPreview, setSelectedRecordForPreview] = useState<ParsedRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'input' | 'preview' | 'export'>('input');
  
  // Creation state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Live parse records
  const records = useMemo(() => {
    return parseRawCsvText(rawText, dobFormat, includePhone);
  }, [rawText, dobFormat, includePhone]);

  if (!isOpen) return null;

  // Handle Download ZIP (Fast 0.1s Client-side)
  const handleDownloadZip = async () => {
    if (records.length === 0) return;

    try {
      setIsProcessing(true);
      setErrorMessage('');
      setStatusMessage('Đang đóng gói file ZIP...');
      setProgressPercent(20);

      const zip = new JSZip();
      const rootFolder = zip.folder(batchName.trim() || 'Bo_Ho_So');

      records.forEach((rec, idx) => {
        const sub = rootFolder?.folder(rec.folderName || `Ho_so_${idx + 1}`);
        sub?.file(fileName.trim() || 'New Text Document.txt', rec.txtContent);
      });

      setProgressPercent(70);
      setStatusMessage('Đang nén dữ liệu...');

      const content = await zip.generateAsync({ type: 'blob' }, (metadata) => {
        setProgressPercent(70 + Math.round(metadata.percent * 0.3));
      });

      // Download file
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${batchName.trim() || 'Bo_Ho_So'}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsSuccess(true);
      setStatusMessage(`Đã tải về thành công file ${batchName.trim() || 'Bo_Ho_So'}.zip (${records.length} thư mục có sẵn file text)!`);
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (err: any) {
      console.error('ZIP creation error:', err);
      setErrorMessage('Lỗi khi tạo file ZIP: ' + err.message);
    } finally {
      setIsProcessing(false);
      setProgressPercent(0);
    }
  };

  const handleCopyAllTxt = () => {
    const combined = records.map((r, i) => `=== [${i + 1}] ${r.folderName} ===\n${r.txtContent}`).join('\n\n');
    navigator.clipboard.writeText(combined);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={() => !isProcessing && onClose()}>
      <div 
        className="modal-container" 
        style={{ maxWidth: '960px', width: '96vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={20} color="#38bdf8" />
            <span>Tự Động Tách Dữ Liệu CSV / Text Hàng Loạt</span>
            {records.length > 0 && (
              <span className="count-tag" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
                Đã tách {records.length} hồ sơ
              </span>
            )}
          </div>
          {!isProcessing && (
            <button className="btn-icon" onClick={onClose} title="Đóng (Esc)">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.2)' }}>
          <button
            className={`tab-btn ${activeTab === 'input' ? 'active' : ''}`}
            onClick={() => setActiveTab('input')}
            style={{ flex: 1, justifyContent: 'center', borderRadius: 0, padding: '12px', fontSize: '0.85rem' }}
          >
            <FileSpreadsheet size={16} />
            <span>1. Dán Dữ liệu CSV / Text ({records.length})</span>
          </button>
          
          <button
            className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
            disabled={records.length === 0}
            style={{ flex: 1, justifyContent: 'center', borderRadius: 0, padding: '12px', fontSize: '0.85rem' }}
          >
            <Eye size={16} />
            <span>2. Xem trước Danh sách Hồ sơ</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => setActiveTab('export')}
            disabled={records.length === 0}
            style={{ flex: 1, justifyContent: 'center', borderRadius: 0, padding: '12px', fontSize: '0.85rem' }}
          >
            <Download size={16} />
            <span>3. Tải về Trọn Bộ (.zip)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {errorMessage && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {isSuccess && (
            <div className="alert alert-success" style={{ marginBottom: 16 }}>
              <CheckCircle2 size={18} />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* TAB 1: INPUT DATA */}
          {activeTab === 'input' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Dán toàn bộ danh sách CSV / Text vào đây:
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    onClick={() => setRawText(SAMPLE_CSV)}
                  >
                    Dán mẫu thử
                  </button>
                  {rawText && (
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      style={{ padding: '4px 10px', fontSize: '0.75rem', color: '#f87171' }}
                      onClick={() => setRawText('')}
                    >
                      <Trash2 size={13} /> Xóa trắng
                    </button>
                  )}
                </div>
              </div>

              <textarea
                className="text-area-editor"
                style={{ 
                  height: '240px', 
                  minHeight: '200px', 
                  background: 'rgba(0,0,0,0.3)', 
                  border: '1px solid var(--border-medium)', 
                  borderRadius: 'var(--radius-md)', 
                  fontSize: '0.82rem',
                  padding: 12,
                  fontFamily: 'JetBrains Mono, monospace',
                  whiteSpace: 'pre',
                }}
                placeholder="Ví dụ dán vào:&#10;SSN,NAME,DOB(YYYY-MM-DD),ADDRESS,CITY,STATE,ZIP,PRICE,BASENAME,PHONES,EMAIL,DL_NUM&#10;613438939,BROOKYLN DAVIS M,2002-01-16,395 JONES DR,LAKE HAVASU CITY,AZ,86406...&#10;625376952,ROSA BRAUNSTEIN D,2002-01-16,10348 N 99TH ST,SCOTTSDALE,AZ,85258..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                autoFocus
              />

              {/* Formatting Options */}
              <div style={{ marginTop: 16, padding: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Settings2 size={15} color="#38bdf8" />
                  <span>Tùy chỉnh định dạng file text bên trong từng thư mục:</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                      Định dạng ngày sinh (*DOB):
                    </label>
                    <select
                      className="search-input"
                      style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem' }}
                      value={dobFormat}
                      onChange={(e) => setDobFormat(e.target.value as DobFormat)}
                    >
                      <option value="M/D/YYYY">M/D/YYYY (Ví dụ: *1/16/2002 - Mặc định)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (Ví dụ: *01/16/2002)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (Ví dụ: *2002-01-16)</option>
                      <option value="RAW">Giữ nguyên gốc trong CSV</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                      Tên file text trong thư mục:
                    </label>
                    <input
                      type="text"
                      className="search-input"
                      style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem' }}
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      placeholder="New Text Document.txt"
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 18 }}>
                    <input
                      type="checkbox"
                      id="chkIncludePhone"
                      checked={includePhone}
                      onChange={(e) => setIncludePhone(e.target.checked)}
                      style={{ width: 16, height: 16, cursor: 'pointer' }}
                    />
                    <label htmlFor="chkIncludePhone" style={{ fontSize: '0.8rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                      Kèm số điện thoại (Phone) nếu có
                    </label>
                  </div>
                </div>
              </div>

              {/* Next Step Button */}
              {records.length > 0 && (
                <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    className="btn-primary"
                    style={{ padding: '10px 20px', fontSize: '0.88rem' }}
                    onClick={() => setActiveTab('preview')}
                  >
                    <span>Xem trước {records.length} hồ sơ đã tách</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PREVIEW TABLE */}
          {activeTab === 'preview' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#38bdf8' }}>
                  Danh sách {records.length} hồ sơ tự động nhận diện:
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-secondary" style={{ padding: '5px 12px', fontSize: '0.75rem' }} onClick={handleCopyAllTxt}>
                    {isCopied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{isCopied ? 'Đã sao chép tất cả!' : 'Copy toàn bộ nội dung text'}</span>
                  </button>
                  <button className="btn-primary" style={{ padding: '5px 14px', fontSize: '0.78rem' }} onClick={() => setActiveTab('export')}>
                    <span>Tiếp tục Tải về trọn bộ ➔</span>
                  </button>
                </div>
              </div>

              {/* Table Container */}
              <div style={{ maxHeight: '440px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.3)' }}>
                <table className="split-preview-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40, color: 'var(--text-muted)' }}>#</th>
                      <th style={{ color: '#38bdf8' }}>Tên Thư Mục (Folder)</th>
                      <th style={{ color: '#fbbf24' }}>SSN</th>
                      <th style={{ color: '#34d399' }}>Ngày sinh</th>
                      <th style={{ color: 'var(--text-secondary)' }}>Địa chỉ</th>
                      <th style={{ color: '#a78bfa' }}>Điện thoại</th>
                      <th style={{ width: 80, textAlign: 'center' }}>Xem .txt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((rec, idx) => (
                      <tr 
                        key={rec.id}
                        className="split-preview-row"
                      >
                        <td style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                        <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <User size={14} color="#38bdf8" />
                            {rec.folderName}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'JetBrains Mono', color: '#fbbf24' }}>{rec.ssn || 'N/A'}</td>
                        <td style={{ color: '#34d399' }}>{rec.dob || 'N/A'}</td>
                        <td style={{ color: 'var(--text-secondary)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {rec.address} {rec.city} {rec.state} {rec.zip}
                        </td>
                        <td style={{ color: '#a78bfa', fontFamily: 'JetBrains Mono' }}>{rec.phone || 'N/A'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="btn-secondary"
                            style={{ padding: '3px 10px', fontSize: '0.72rem' }}
                            onClick={() => setSelectedRecordForPreview(rec)}
                          >
                            <Eye size={12} />
                            <span>Xem</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Single Item Content Preview Modal/Drawer */}
              {selectedRecordForPreview && (
                <div style={{ marginTop: 14, padding: 14, background: 'rgba(15, 23, 42, 0.95)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.85rem' }}>
                      Nội dung file "{fileName}" của: {selectedRecordForPreview.folderName}
                    </span>
                    <button className="btn-icon" style={{ width: 24, height: 24 }} onClick={() => setSelectedRecordForPreview(null)}>
                      <X size={14} />
                    </button>
                  </div>
                  <pre style={{ margin: 0, padding: 10, background: 'rgba(0,0,0,0.4)', borderRadius: 4, fontSize: '0.82rem', fontFamily: 'JetBrains Mono', color: '#e2e8f0', whiteSpace: 'pre-wrap' }}>
                    {selectedRecordForPreview.txtContent}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EXPORT OPTIONS */}
          {activeTab === 'export' && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                  Tên Thư mục Bộ chính:
                </label>
                <input
                  type="text"
                  className="search-input"
                  style={{ width: '100%', padding: '10px 14px', fontSize: '0.92rem' }}
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="Ví dụ: 40 bộ AZ, 30 bộ lee..."
                />
              </div>

              {/* Guide Box */}
              <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <Info size={20} color="#38bdf8" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <strong style={{ color: '#38bdf8' }}>Quy trình tạo bộ chuẩn và nhanh nhất:</strong>
                  <br />
                  Vì bạn đang lưu trữ trên <strong>Google Drive cá nhân (gói 5TB)</strong>, tài khoản robot chỉ có quyền quản lý và sửa file. Bạn chỉ cần nhấn nút <strong>"Tải về File ZIP"</strong> bên dưới:
                  <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                    <li>File zip tải về ngay trong <strong>0.1 giây</strong>, chứa sẵn đầy đủ <strong>{records.length} thư mục con</strong> và từng file <code>{fileName}</code> chuẩn.</li>
                    <li>Bạn giải nén ra máy tính, thả ảnh passport vào và <strong>kéo thả cả thư mục lên Google Drive</strong> (sử dụng 5TB của bạn).</li>
                    <li>Tool trên web sẽ <strong>tự động nhận diện đầy đủ cả thư mục, file text và ảnh ngay lập tức</strong>!</li>
                  </ul>
                </div>
              </div>

              {/* Export Action Card */}
              <div style={{ background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08), rgba(59, 130, 246, 0.05))', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: 'var(--radius-lg)', padding: 24, textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', marginBottom: 12 }}>
                  <FolderArchive size={30} />
                </div>
                
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Tải về Trọn Bộ "{batchName}" ({records.length} hồ sơ)
                </h3>
                
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto 20px auto' }}>
                  Đã tạo sẵn cấu trúc thư mục con và file text định dạng <code>{fileName}</code> cho từng người.
                </p>

                <button
                  className="btn-primary"
                  style={{ padding: '14px 36px', fontSize: '0.95rem', fontWeight: 700, background: 'linear-gradient(135deg, #0284c7, #38bdf8)', color: '#020617', margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 'var(--radius-md)', boxShadow: '0 4px 16px rgba(56, 189, 248, 0.3)' }}
                  onClick={handleDownloadZip}
                  disabled={isProcessing}
                >
                  <Download size={18} />
                  <span>Tải về File ZIP (.zip) ngay</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
