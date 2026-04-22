# Gemini Transcribe Pro

Ứng dụng chuyển đổi Video/Audio thành văn bản sử dụng Google Gemini AI.

## Hướng dẫn cài đặt và chạy

Đây là ứng dụng Web (React), không phải Python Streamlit.

1. **Cài đặt Node.js**: [Tải tại đây](https://nodejs.org/) (Chọn bản LTS).
2. **Cài đặt thư viện**:
   ```bash
   npm install
   ```
3. **Chạy ứng dụng**:
   ```bash
   npm run dev
   ```
4. **Sử dụng**:
   - Mở trình duyệt tại `http://localhost:3000`
   - Nhập API Key Google Gemini (lấy tại [aistudio.google.com](https://aistudio.google.com))
   - Chọn file MP3/MP4 để chuyển đổi.

## Tính năng
- Hỗ trợ file lớn (lên đến 5GB).
- Tự động nhận diện ngôn ngữ.
- Tóm tắt nội dung + Chép lời chi tiết.
- Chạy trên mọi nền tảng (Windows, Mac, Android, iOS).
