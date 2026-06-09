# 漢學 — Hán Tự

Ứng dụng học và kiểm tra chữ Hán phồn thể với Hán Việt và nghĩa tiếng Việt.

Hoạt động hoàn toàn trên trình duyệt, đồng bộ tiến độ qua Google Sheets.
Không cần server, không cần backend trả phí.

---

## Tính năng

- **Từ điển sẵn**: 1040+ chữ Hán phồn thể có sẵn Hán Việt + nghĩa Việt
- **Sửa nghĩa**: bấm nút ✏️ trên từng chữ để bổ sung/chỉnh nghĩa theo ý mình
- **8 chế độ kiểm tra**:
  - 📇 Flashcard — lật thẻ
  - 字 Chữ → Hán Việt — trắc nghiệm 4 đáp án
  - 義 Nghĩa → Chữ
  - 意 Chữ → Nghĩa
  - □ Điền chỗ trống — điền chữ vào câu mẫu
  - 序 Sắp xếp chữ — xếp chữ thành câu
  - 讀 Đọc hiểu — đoạn văn ngắn + câu hỏi
  - ⌨ Gõ Hán Việt — chấp nhận có/không dấu
- **Tiến độ chi tiết**: theo dõi số lần đúng/sai/cần ôn cho từng chữ
- **Phân loại tự động**: chưa học · đang học · đã thuộc · cần ôn
- **Mở rộng**: upload file `ds_cac_chu.txt` mới để thêm chữ vào danh sách
- **Sao lưu**: xuất JSON, đồng bộ Google Sheets

## Công nghệ

- HTML/CSS/JS thuần (không framework, không build step)
- Google Apps Script backend (miễn phí)
- GitHub Pages hosting (miễn phí)
- Fonts: Noto Serif TC, Crimson Pro, Inter, JetBrains Mono

## Cài đặt

Xem chi tiết trong [`docs/SETUP.md`](docs/SETUP.md). Tóm tắt:

1. Tạo Google Sheet → dán code `docs/apps-script.gs` → deploy thành Web App
2. Upload toàn bộ folder này lên GitHub → bật Pages
3. Mở app → Cài đặt → dán URL Apps Script → xong

Khoảng 15 phút từ đầu đến cuối.

## Cấu trúc dự án

```
han-tu-app/
├── index.html              # Vào điểm chính
├── css/
│   └── style.css          # Toàn bộ style
├── js/
│   ├── dictionary-data.js  # Từ điển Hán Việt 1040 chữ
│   ├── storage.js          # localStorage + sync layer
│   ├── tests.js            # 8 chế độ kiểm tra
│   └── app.js              # Điều khiển chính
├── data/
│   ├── dictionary.json     # Dữ liệu từ điển (dạng JSON)
│   └── ds_cac_chu.txt      # Danh sách chữ mặc định
└── docs/
    ├── SETUP.md            # Hướng dẫn cài đặt
    └── apps-script.gs      # Code backend
```

## Phong cách thiết kế

Lấy cảm hứng từ sổ của học giả Hán Nôm: mực đen, giấy mộc, dấu chu sa (朱印). Tránh các mẫu thiết kế AI thường gặp (cream + serif + terracotta).

- Bảng màu: paper `#FAFAF5`, ink `#1A1A1A`, seal red `#BC3D3D`, jade `#3F6B5C`
- Typography: Crimson Pro (Latin display) + Noto Serif TC (Hán) + Inter (body)
- Signature element: dấu chu sa "朱印" nghiêng nhẹ làm điểm nhấn

## License

MIT — dùng tự do cho mục đích cá nhân/giáo dục.

## Lời cảm ơn

學而時習之，不亦說乎 — *Học rồi thường xuyên ôn lại, chẳng vui lắm sao.*
