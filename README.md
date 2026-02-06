# app_phuoc

Ứng dụng quét mã vạch sản phẩm với Next.js và Google Sheets.

## Tính năng

- 📷 Quét mã vạch bằng camera điện thoại
- 🔍 Tra cứu sản phẩm từ Google Sheets
- ➕ Thêm sản phẩm mới nếu chưa có
- 📱 Giao diện mobile-first

## Cài đặt

```bash
npm install
npm run dev
```

## Cấu hình

Tạo file `.env.local`:

```
GOOGLE_SHEETS_ID=your_sheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-email@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Deploy

Deploy lên Vercel và thêm environment variables.
