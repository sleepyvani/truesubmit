# Backend API Documentation (`apps/api`) 🎛️

Hệ thống API Backend của **TrueSubmit** được phát triển trên nền tảng **NestJS (TypeScript)** và **Drizzle ORM** kết hợp **PostgreSQL**. Đây là bộ não điều phối dữ liệu, tiếp nhận bài nộp và phân phối công việc cho các Worker chấm bài.

---

## 🛠️ Tech Stack & Thư viện sử dụng
- **Framework**: NestJS (TypeScript)
- **Database ORM**: Drizzle ORM + Pg-driver (PostgreSQL)
- **Cache & Queue Client**: Redis (IoRedis)
- **Giao tiếp Real-time**: Server-Sent Events (SSE) (NestJS hỗ trợ gốc qua RxJS)
- **Bảo mật & Rate Limit**: `@nestjs/throttler` (Chống spam nộp bài)
- **Xác thực**: JWT (JSON Web Token) + Passport

---

## 🏗️ Cấu trúc thư mục đề xuất (`apps/api`)

```text
apps/api/
├── src/
│   ├── main.ts              # Điểm khởi chạy ứng dụng (Config port, CORS, ValidationGlobal)
│   ├── app.module.ts        # Module gốc, import cấu hình DB, Redis, Queue và các sub-modules
│   ├── database/            # Quản lý schema, migrations và connection Drizzle
│   │   ├── schema.ts        # Định nghĩa các bảng Database
│   │   └── database.module.ts
│   ├── auth/                # Module xử lý Đăng nhập, Đăng ký, Phân quyền
│   ├── problems/            # Module quản lý đề bài, testcase (CRUD)
│   ├── submissions/         # Module tiếp nhận bài nộp, đẩy vào Queue
│   │   └── submissions.controller.ts # Nhận bài nộp và chứa SSE Endpoint để đẩy kết quả chấm bài
│   └── queue/               # Module cấu hình giao tiếp hàng đợi Redis
└── drizzle.config.ts        # File cấu hình Drizzle Kit
```

---

## 🗄️ Database Schema Đề xuất (Drizzle ORM)

Để đảm bảo hiệu năng đọc/ghi tối ưu, các bảng cơ sở dữ liệu được định nghĩa tinh gọn:
- **`users`**: Lưu thông tin tài khoản, quyền (Student, Admin/Teacher).
- **`problems`**: Lưu thông tin đề bài, giới hạn thời gian (Time Limit) và bộ nhớ (Memory Limit).
- **`submissions`**: Lưu code của sinh viên, ngôn ngữ, trạng thái tổng quan (`PENDING`, `COMPILING`, `RUNNING`, `ACCEPTED`, `WRONG_ANSWER`, `TIME_LIMIT_EXCEEDED`, ...).
- **`testcases`**: Lưu các cặp đầu vào (Input) và đầu ra mong muốn (Expected Output) của từng bài toán.

---

## ⚡ Thiết kế xử lý Tải cao (1000 Sinh viên nộp bài đồng thời)

### 1. Tiếp nhận và Phản hồi cực nhanh (Low Latency Submission)
Khi sinh viên bấm "Nộp bài", NestJS API sẽ xử lý tối giản và phản hồi ngay lập tức để giải phóng request:
- **Không thực thi đồng bộ**: API **không tự chạy hay biên dịch code**, cũng không đợi Docker thực thi xong mới trả kết quả.
- **Quy trình xử lý cực nhanh (< 15ms)**:
  1. Validate định dạng dữ liệu đầu vào.
  2. Dùng Drizzle tạo mới một record `submission` trạng thái `PENDING` trong PostgreSQL.
  3. Lấy thông tin giới hạn tài nguyên của bài toán (thời gian tối đa, bộ nhớ RAM, CPU Cores) từ bảng `problems`.
  4. Đẩy một Job chứa thông tin `{ submissionId, language, code, timeLimit, memoryLimit, cpuLimit }` vào **Redis Queue** (dạng List/Stream) thông qua lệnh `LPUSH`.
  5. Trả ngay mã `201 Created` kèm theo `submissionId` cho frontend.

### 2. Sử dụng Drizzle ORM thay vì Prisma
- **Lý do**: Prisma sinh ra một engine Rust chạy ngầm có thể tiêu tốn thêm bộ nhớ RAM và có độ trễ khởi tạo truy vấn (Cold Start/Connection overhead).
- **Ưu điểm của Drizzle**: Drizzle hoạt động như một query builder thuần túy trên driver PostgreSQL, cho phép thực thi các câu lệnh SQL với tốc độ tối đa của driver nền, giảm thiểu thời gian CPU block của Node.js khi có hàng nghìn truy vấn đồng thời.

- Dùng `@nestjs/throttler` cấu hình giới hạn tần suất nộp bài của mỗi sinh viên (ví dụ: tối đa 1 lần nộp bài mỗi 10 giây). Điều này ngăn ngừa các hành vi viết script nộp bài spam liên tục làm sập queue hoặc cạn kiệt tài nguyên Docker Sandbox của Worker.
- Tận dụng Redis làm bộ nhớ lưu trữ rate limit để chia sẻ tải tốt hơn.

### 4. API Nội bộ tiếp nhận kết quả chấm bài (Internal Results API)
- Thiết lập endpoint: `PATCH /api/internal/submissions/:id/result` dành riêng cho Worker Golang.
- Endpoint này được bảo vệ bởi middleware đối sánh khóa bí mật `APP_INTERNAL_AUTH_TOKEN` để tránh sinh viên tự gửi giả lập kết quả.
- Khi nhận được dữ liệu, API thực hiện:
  1. Ghi nhận kết quả chấm bài chi tiết vào bảng `submission_results` thông qua Drizzle ORM.
  2. Đẩy sự kiện realtime tới luồng stream SSE của sinh viên tương ứng để cập nhật UI của Next.js ngay lập tức.

---

## ⚙️ Cấu hình Môi trường (`.env`)

Tạo file `.env` ở thư mục gốc của `apps/api` dựa trên file `.env.example`. Để tối giản hóa việc cấu hình khi di chuyển môi trường, các biến cấu hình được tinh gọn tối đa:

| Biến môi trường | Ý nghĩa | Giá trị mẫu |
| :--- | :--- | :--- |
| `APP_DATABASE_URI_VALUE` | Chuỗi kết nối PostgreSQL (dùng cho Drizzle ORM) | `postgresql://postgres:password@localhost:5432/truesubmit?schema=public` |
| `APP_REDIS_CONN_STRING` | Chuỗi kết nối Redis (giao thức `redis://`) | `redis://127.0.0.1:6379` |
| `APP_INTERNAL_AUTH_TOKEN`| Token xác thực bảo mật kết nối từ Worker | `secure_internal_token_for_communication` |

### 📝 Các cấu hình được Code cứng / Fallback trong code:
- **Cổng Server (`PORT`) & Môi trường (`NODE_ENV`)**: Được xác định trực tiếp trong mã nguồn (mặc định port `3001` cho dev và tự động nhận dạng môi trường).
- **Cấu hình CORS (`CORS_ORIGIN`)**: Sử dụng một **mảng các domain được phép** khai báo trực tiếp trong `main.ts` (ví dụ: `['http://localhost:3000', 'https://truesubmit.yourdomain.com']`). Điều này loại bỏ hoàn toàn việc phải cấu hình CORS thủ công qua file `.env`.
- **Tên hàng đợi (`SUBMISSION_QUEUE_NAME`)**: Code cứng trực tiếp chuỗi `"submission_queue"` dùng chung cho cả NestJS và Golang Worker.
- **Thời gian hết hạn JWT (`JWT_EXPIRES_IN`)**: Cố định `"7d"`.
- **Khóa bảo mật JWT (`JWT_SECRET`)**: Sử dụng cơ chế fallback an toàn: `process.env.JWT_SECRET || 'fallback-secret-for-dev'`.


