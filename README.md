# TrueSubmit 🚀

**TrueSubmit** là hệ thống Online Judge nội bộ được thiết kế chuyên biệt cho sinh viên, giúp rèn luyện thuật toán, chấm bài tự động và theo dõi tiến độ học tập.

---

## 🏗️ Kiến trúc (Monorepo)
Dự án được xây dựng theo mô hình Monorepo bằng **Turborepo**, đảm bảo tính đồng bộ và quản lý hiệu quả giữa các thành phần:

- **`apps/web`**: Frontend (Next.js 15) – Giao diện người dùng, bảng xếp hạng và dashboard.
- **`apps/api`**: Backend (NestJS) – Quản lý user, đề bài, submission và hệ thống phân quyền.
- **`apps/worker`**: Execution Engine (Golang) – Trái tim hệ thống, thực thi code trong môi trường Sandbox (Docker) để chấm bài an toàn.

## 🛠️ Tech Stack
- **Frontend**: Next.js, TailwindCSS, Shadcn/UI.
- **Backend API**: NestJS (TypeScript), PostgreSQL (Prisma).
- **Execution Engine**: Golang + Docker SDK.
- **Message Queue**: Redis + BullMQ (Điều phối các bài nộp).
- **Tooling**: Turborepo, Docker.

## 🚀 Tính năng nổi bật
- **Đa ngôn ngữ**: Hỗ trợ C/C++, C#, Go, Java, Python với khả năng tùy chọn version qua Docker Image.
- **Sandbox An toàn**: Mỗi bài nộp được cô lập hoàn toàn trong container, giới hạn tài nguyên (CPU/RAM) và thời gian thực thi.
- **Real-time Feedback**: Thông báo kết quả chấm bài ngay lập tức tới người dùng.

## ⚙️ Cách bắt đầu

1. **Clone repo và cài đặt:**
   ```bash
   pnpm install