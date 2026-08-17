# ARI Drive Explorer 🚀

Ứng dụng quản lý thư mục Google Drive dạng **File Explorer** hiện đại, chuyên dụng để duyệt hồ sơ theo cấu trúc đa cấp, xem ảnh, chỉnh sửa file `.txt` trực tiếp trên web và đổi tên trạng thái nhanh với 1 cú click (`_OK`, `_2_3_DAY`, `_KO`).

---

## 📁 Cấu trúc Thư mục Hỗ trợ

```
ARI (Thư mục Gốc)
 └── 30 bộ lee (Thư mục Nhóm / Batch)
      ├── VANESSA PADILLA           --> Nhấn "Done" đổi thành VANESSA PADILLA_OK
      │    ├── New Text Document.txt (Mở xem & Sửa trực tiếp, bấm Lưu Ctrl+S)
      │    └── 2.png                 (Xem trực tiếp, phóng to / xoay ảnh)
      ├── VALLIE JONES              --> Nhấn "2-3 Ngày" đổi thành VALLIE JONES_2_3_DAY
      └── TIFFANY GEORGE            --> Nhấn "KO" đổi thành TIFFANY GEORGE_KO
```

---

## ✨ Tính năng Nổi bật

1. **Giao diện 3 Khung Hiện Đại (Obsidian Slate / Windows 11 Explorer)**:
   - **Khung 1 (Sidebar)**: Cây thư mục các bộ (`30 bộ lee`,...), thanh tìm kiếm, bộ lọc trạng thái và thanh tiến độ hoàn thành theo thời gian thực.
   - **Khung 2 (Danh sách bộ con)**: Danh sách các thư mục con kèm nhãn màu Badge và các nút bấm đổi trạng thái tức thì.
   - **Khung 3 (Nội dung & Soạn thảo)**:
     - **Trình soạn thảo Text**: Chỉnh sửa file `.txt` trực tiếp, đếm số từ/dòng, phím tắt `Ctrl+S` để lưu lên Google Drive.
     - **Thư viện ảnh**: Xem ảnh `.png`, `.jpg` trực tiếp, phóng to thu nhỏ (Zoom), xoay góc 90°, mở Lightbox toàn màn hình.

2. **Bộ 3 Nút Đổi Trạng Thái 1-Click**:
   - 🟢 **✓ Done**: Đổi tên folder thành `[TÊN]_OK`
   - 🟡 **⏳ 2-3 Ngày**: Đổi tên folder thành `[TÊN]_2_3_DAY`
   - 🔴 **✕ Không được (KO)**: Đổi tên folder thành `[TÊN]_KO`
   - 🔄 **Khôi phục gốc**: Xóa hậu tố trạng thái để trở về tên gốc ban đầu.

3. **Hệ thống Phím tắt Nhanh (Keyboard Shortcuts)**:
   - `1`: Đổi folder đang chọn thành `_OK`
   - `2`: Đổi folder đang chọn thành `_2_3_DAY`
   - `3`: Đổi folder đang chọn thành `_KO`
   - `0`: Khôi phục tên gốc
   - `Ctrl + S`: Lưu file `.txt` lên Drive
   - `↑ / ↓`: Di chuyển nhanh giữa các bộ hồ sơ

4. **Chế độ Demo Mẫu (Mock Mode)**:
   - Tự động kích hoạt khi chưa có cấu hình Google Drive, giúp bạn trải nghiệm ngay lập tức với dữ liệu mô phỏng đúng hệt ảnh thực tế.

---

## 🛠️ Hướng dẫn Cài đặt & Chạy Local

1. Mở terminal tại thư mục dự án và cài đặt dependencies:
   ```bash
   npm install
   ```

2. Khởi động môi trường phát triển:
   ```bash
   npm run dev
   ```

3. Mở trình duyệt truy cập: `http://localhost:3000`

---

## ☁️ Hướng dẫn Deploy lên Vercel & Kết nối Google Drive

### Bước 1: Tạo Google Cloud Service Account
1. Vào [Google Cloud Console](https://console.cloud.google.com/).
2. Tạo 1 dự án mới (ví dụ: `ARI-Drive-Tool`).
3. Vào mục **APIs & Services** > **Library** > Tìm kiếm **Google Drive API** và bấm **Enable**.
4. Vào mục **Credentials** > **Create Credentials** > Chọn **Service Account**.
5. Nhập tên Service Account (ví dụ: `drive-bot`) > Bấm hoàn tất.
6. Nhấp vào Service Account vừa tạo > Tab **Keys** > **Add Key** > **Create new key** > Chọn **JSON** > Tải file key về máy.

### Bước 2: Chia sẻ thư mục Drive
1. Mở Google Drive, tìm đến thư mục `ARI`.
2. Bấm chuột phải > **Chia sẻ (Share)**.
3. Dán email của Service Account (dạng `...@...iam.gserviceaccount.com`) vào và cấp quyền **Người chỉnh sửa (Editor)**.

### Bước 3: Cấu hình biến môi trường trên Vercel
Khi đẩy mã nguồn lên GitHub/Vercel, thêm 2 biến môi trường vào mục **Environment Variables**:

- `GOOGLE_SERVICE_ACCOUNT_KEY`: Dán toàn bộ nội dung trong file JSON bạn đã tải về ở Bước 1.
- `GOOGLE_DRIVE_ROOT_FOLDER_ID`: ID của thư mục `ARI` (Ví dụ: `1QjVV2u_aiNPriykD1ixD1_h77sb7wUPh`).
