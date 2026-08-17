import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ARI Drive Explorer - Quản lý Hồ sơ Google Drive',
  description: 'Trình quản lý tệp Google Drive dạng File Explorer đa cấp, xem ảnh, chỉnh sửa text .txt và gắn nhãn trạng thái _OK, _2_3_DAY, _KO tức thì.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
