# Hướng dẫn cài đặt

Web app này gồm 2 phần:
1. **Frontend**: HTML/CSS/JS chạy trên GitHub Pages (miễn phí)
2. **Backend**: Google Apps Script lưu dữ liệu vào Google Sheets của bạn

Cài đặt mất khoảng 15 phút.

---

## Phần 1 — Backend (Google Apps Script)

### Bước 1: Tạo Google Sheet mới

1. Vào https://sheets.google.com
2. Tạo Sheet mới, đặt tên gì cũng được (ví dụ: "Hán Tự Backend")

### Bước 2: Mở Apps Script editor

1. Trong sheet vừa tạo: **Extensions → Apps Script**
2. Xóa hết code mẫu trong file `Code.gs`
3. Mở file `docs/apps-script.gs` trong project này, copy **toàn bộ** nội dung
4. Paste vào file `Code.gs` của Apps Script
5. Lưu (Ctrl+S hoặc Cmd+S), đặt tên project (ví dụ: "HanTu Backend")

### Bước 3: Deploy thành Web App

1. Trong Apps Script editor: **Deploy → New deployment**
2. Click bánh răng bên trái "Select type" → chọn **Web app**
3. Điền thông tin:
   - **Description**: `Han Tu Web App v1`
   - **Execute as**: `Me (tên bạn)`
   - **Who has access**: **`Anyone`** ⚠️ Bắt buộc chọn Anyone, không phải "Anyone with Google account"
4. Click **Deploy**
5. Khi được hỏi quyền, click **Authorize access**, chọn tài khoản Google của bạn
6. Khi hiện cảnh báo "Google hasn't verified this app", click **Advanced → Go to (tên project) (unsafe)**
   - Đây là code của bạn nên không có rủi ro gì
7. Click **Allow**
8. Copy URL ở dòng **Web app URL**, dạng `https://script.google.com/macros/s/AKfycb.../exec`

### Bước 4: Test backend

Trong Apps Script editor:
1. Mở dropdown gần nút Run, chọn `_testPing`
2. Click **Run**, đợi vài giây
3. Mở tab **Execution log**, phải thấy thông báo `pong`

Nếu thấy `pong` → backend OK.

---

## Phần 2 — Frontend (GitHub Pages)

### Bước 1: Tạo repo GitHub

1. Vào https://github.com, đăng nhập
2. Tạo repo mới (public hoặc private đều được), ví dụ tên: `han-tu-app`
3. Upload toàn bộ folder này lên repo
   - Cách 1: Trên web GitHub, chọn "uploading an existing file", kéo thả các file vào
   - Cách 2: Dùng Git CLI:
     ```
     git init
     git add .
     git commit -m "Initial commit"
     git branch -M main
     git remote add origin https://github.com/USERNAME/han-tu-app.git
     git push -u origin main
     ```

### Bước 2: Bật GitHub Pages

1. Vào repo → **Settings → Pages** (menu trái)
2. Source: chọn **Deploy from a branch**
3. Branch: chọn **main** và **/ (root)**
4. Click **Save**
5. Đợi ~1 phút, refresh trang Pages
6. GitHub sẽ hiện URL của bạn, dạng: `https://USERNAME.github.io/han-tu-app/`

### Bước 3: Mở app và cấu hình

1. Mở URL GitHub Pages trên trình duyệt
2. Click tab **Cài đặt**
3. Trong ô **Đồng bộ Google Sheets**, dán URL Web App từ Phần 1
4. Click **Lưu**
5. Click **Kiểm tra kết nối**
6. Nếu thấy toast "Kết nối OK" → done!

---

## Sử dụng

- **Trang chủ**: dashboard tiến độ và bắt đầu nhanh
- **Học**: xem toàn bộ chữ Hán, click vào chữ để xem/sửa nghĩa (✏️)
- **Kiểm tra**: 8 chế độ luyện tập
- **Cài đặt**: upload file `ds_cac_chu.txt` mới để mở rộng danh sách

Dữ liệu được lưu cả ở localStorage trình duyệt và tự đồng bộ lên Google Sheets sau mỗi vài giây hoạt động.

---

## Khắc phục sự cố

### "Kết nối OK" nhưng dữ liệu không lên Sheet

- Mở Apps Script editor, vào **Executions** (icon đồng hồ bên trái)
- Xem có execution lỗi nào không
- Lỗi thường gặp: chưa Deploy lại sau khi sửa code → Deploy → Manage deployments → Edit → New version

### Toast "Lỗi: HTTP 401" hoặc "Failed to fetch"

- Kiểm tra lại URL Apps Script (phải kết thúc bằng `/exec`)
- Đảm bảo deploy với **Who has access: Anyone** (không phải "Anyone with Google account")
- Thử mở URL Apps Script trong tab mới — phải hiện JSON `{"ok":true,"message":"Han Tu Backend is running..."}`

### Chữ Hán hiển thị thành ô vuông

- Trình duyệt chưa tải font Noto Serif TC. Refresh trang vài lần.
- Nếu dùng Safari iOS cũ: cập nhật lên iOS 15+

### Upload file mà không thấy có chữ Hán nào

- File phải là `.txt` UTF-8, chứa ký tự Hán phồn thể (Unicode `3400-9FFF`)
- Mở file bằng Notepad++ hoặc VS Code để kiểm tra encoding

### Sửa code Apps Script sau khi đã deploy

Sau khi sửa code, **phải** redeploy:
1. **Deploy → Manage deployments**
2. Click bút chì ✏️ bên cạnh deployment hiện tại
3. **Version**: chọn **New version**
4. Click **Deploy**

URL không thay đổi, nhưng version cũ sẽ ngưng hoạt động.

---

## Cấu trúc dữ liệu trong Google Sheets

Sau lần sync đầu tiên, sheet sẽ tự tạo 3 tab:

- **Progress**: tiến độ học từng chữ
  - Cột: char, seen, correct, wrong, lastSeen, customMeaning
- **CharList**: danh sách thứ tự các chữ đang học
  - Cột: index, char
- **Meta**: metadata sync
  - Cột: key, value

Không nên sửa trực tiếp các sheet này (sẽ bị ghi đè ở lần sync tiếp theo). Nếu muốn backup, dùng nút **Xuất JSON** trong Cài đặt.
