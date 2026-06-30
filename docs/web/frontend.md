# Frontend Application Documentation (`apps/web`) 🌐

Hệ thống giao diện người dùng (Frontend) của **TrueSubmit** được xây dựng bằng **Next.js 16.2 (App Router)** và **TailwindCSS**, mang lại trải nghiệm người dùng mượt mà, phản hồi thời gian thực và khả năng hiển thị tối ưu trên nhiều thiết bị.

---

## 🛠️ Tech Stack & Thư viện sử dụng
- **Core**: Next.js 16.2 (App Router, React 19)
- **Styling**: TailwindCSS
- **UI Components**: Shadcn/UI (Radix UI)
- **Trình soạn thảo**: Monaco Editor (`@monaco-editor/react`)
- **Quản lý State & Gọi API**: tRPC Client (kết nối Type-safe không cần định nghĩa URL với NestJS)
- **Giao tiếp Real-time**: Server-Sent Events (SSE) (API EventSource có sẵn của trình duyệt)

---

## 🏗️ Cấu trúc thư mục đề xuất (`apps/web`)

```text
apps/web/
├── app/
│   ├── layout.tsx         # Layout dùng chung (Navigation, Footer, Providers)
│   ├── page.tsx           # Trang chủ (Giới thiệu, Thống kê nhanh)
│   ├── problems/          # Quản lý đề bài
│   │   ├── page.tsx       # Danh sách đề bài (Hỗ trợ bộ lọc và phân trang)
│   │   └── [id]/          # Chi tiết đề bài & Giao diện nộp code (Workspace)
│   ├── submissions/       # Lịch sử nộp bài cá nhân và toàn hệ thống
│   └── leaderboard/       # Bảng xếp hạng realtime của sinh viên
├── components/            # UI components tái sử dụng
│   ├── editor/            # Monaco Code Editor wrapper
│   ├── ui/                # Nguyên tử UI từ Shadcn (Button, Dialog, Card...)
│   └── shared/            # Layout components (Navbar, Sidebar)
├── hooks/                 # Custom React hooks (useSSE, useAuth)
├── lib/                   # Khởi tạo tRPC client và các helper
└── public/                # Static assets (images, icons)
```

---

## 🚀 Các tính năng chính & Giao diện quan trọng

### 1. Workspace Làm Bài (Problem Details & Code Editor)
- **Mô tả**: Giao diện chia làm 2 cột chính:
  - **Cột trái**: Chi tiết bài toán (Đề bài, ví dụ Input/Output, Ràng buộc thời gian/bộ nhớ).
  - **Cột phải**: Trình soạn thảo mã nguồn (Monaco Editor) hỗ trợ tô sáng cú pháp (C++, Java, Python, Go, C#), bảng chọn ngôn ngữ, nút "Chạy thử" (Run code với testcase mẫu) và "Nộp bài" (Submit).

### 2. Bảng Xếp Hạng (Leaderboard)
- Cập nhật thời gian thực điểm số, số bài đã AC (Accepted), và thời gian làm bài của sinh viên.
- Sử dụng kết nối Server-Sent Events (SSE) để cập nhật thứ hạng ngay lập tức khi có sinh viên thay đổi điểm số.

---

## ⚡ Tối ưu hóa cho kịch bản tải cao (1000 Sinh viên đồng thời)

Để đảm bảo tốc độ phản hồi cực nhanh và không làm nghẽn hệ thống khi 1000 sinh viên truy cập cùng lúc trong giờ thi:

### 1. Caching & Static Rendering cho Trang Đề Bài (Problems)
- Sử dụng cơ chế **Static Site Generation (SSG)** hoặc **Incremental Static Regeneration (ISR)** cho danh sách đề bài và chi tiết đề bài. 
- Khi sinh viên tải trang chi tiết bài thi, Next.js sẽ phục vụ trang HTML đã được render sẵn từ CDN/Cache thay vì gửi truy vấn đọc cơ sở dữ liệu liên tục.

### 2. Truyền nhận kết quả Real-time thay vì Client-side Polling
- **Vấn đề**: Việc 1000 sinh viên cùng nộp bài và client liên tục gửi request HTTP GET mỗi 2 giây để check trạng thái chấm bài (Polling) sẽ tạo ra **500 - 1000 request/giây**, gây nghẽn NestJS API.
- **Giải pháp**: Tích hợp **Server-Sent Events (SSE)**. Khi sinh viên bấm "Nộp bài", Next.js gọi một tRPC mutation (`trpc.submissions.submit.useMutation()`) để gửi code lên. API sẽ lưu job và trả về `submissionId`. Sau đó, client khởi tạo một kết nối `EventSource` lắng nghe luồng sự kiện từ API (ví dụ: `/api/submissions/:id/sse`). Khi Golang Worker chấm xong (gửi kết quả về NestJS qua gRPC), NestJS sẽ phát tín hiệu qua luồng stream SSE này để client cập nhật UI ngay lập tức và tự động đóng kết nối.

### 3. Tối ưu dung lượng tải trang (Bundle Size)
- Trình soạn thảo Monaco Editor rất nặng. Cần thực hiện **Dynamic Import** (Lazy Loading) cho component Code Editor để giảm thiểu thời gian tải trang ban đầu của sinh viên.

---

## ⚙️ Cấu hình Môi trường (`.env`)

Tạo file `.env` ở thư mục gốc của `apps/web` dựa trên file `.env.example`:

| Biến môi trường | Ý nghĩa | Giá trị mẫu |
| :--- | :--- | :--- |
| `APP_BACKEND_URL` | Địa chỉ URL của API Gateway (NestJS) (Chạy cổng tRPC HTTP và SSE) | `http://localhost:3001` |


