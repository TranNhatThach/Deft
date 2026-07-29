# 🛡️ Deft — Personal Finance Management System

**Deft** là ứng dụng quản lý tài chính cá nhân thông minh, bảo mật cao được xây dựng theo kiến trúc **Contract-First** phân tách hoàn toàn giữa Backend và Mobile Application.

---

## 🏗️ Kiến trúc & Công nghệ (Tech Stack)

- **Mobile App (`mobile-deft`)**: React Native, Expo SDK 53, Lucide Icons Native, TypeScript.
- **Backend (`backend-deft`)**: NestJS 10, Prisma ORM, PostgreSQL 16, JWT Refresh Token Rotation, `@nestjs/throttler` (Rate Limiting).
- **Shared Module (`shared/`)**: Single Source of Truth cho Domain Entities, Request/Response DTOs, API Paths, và Design Tokens.
- **Containerization & CI/CD**: Docker, Docker Compose, GitHub Actions.

---

## ⚡ Tính năng nổi bật (Key Features)

1. **Quản lý Hạn mức & Ngân sách**: Thiết lập tổng hạn mức kỳ và hạn mức theo từng danh mục.
2. **Cảnh báo Ngưỡng Tự động**: Hệ thống tự động gửi thông báo khi chi tiêu chạm ngưỡng **50%, 70%, 80%, 100%**.
3. **Quản lý Giao dịch & Phân loại**: Bộ lọc chip danh mục, chọn ngày, nhóm giao dịch theo thời gian.
4. **Bảo mật Cấp Ngân hàng (Bank-grade Security)**:
   - Rate limiting 5 lần thử/15 phút trên các endpoint xác thực.
   - JWT Access Token (15 phút) + Refresh Token Rotation mã hóa SHA-256 trong Database.
   - Whitelist & Sanitization toàn bộ DTO đầu vào.

---

## 🚀 Hướng dẫn Chạy Dự án (Quick Start)

### 1. Yêu cầu môi trường
- Node.js (v18 trở lên)
- Docker & Docker Compose (nếu chạy DB máy địa phương)
- App **Expo Go** trên điện thoại iOS / Android

### 2. Cấu hình Môi trường
Sao chép file cấu hình mẫu `.env.example` thành `.env`:
```bash
cp .env.example .env
```

### 3. Chạy Backend (NestJS)
```bash
cd backend-deft
npm install
npx prisma generate
npm run start:dev
```
*Backend API sẽ chạy tại: `http://localhost:3000`*

### 4. Chạy Mobile App (Expo)
```bash
cd mobile-deft
npm install
npx expo start
```
*Dùng app **Expo Go** trên điện thoại để quét mã QR hiển thị trên Terminal.*

---

## 🧪 Unit Tests

Chạy Unit Tests Backend:
```bash
cd backend-deft
npm test
```

---

## 📄 Giấy phép (License)
Bản quyền thuộc về **Deft Startup Team**.
