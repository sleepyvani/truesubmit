# Backend API Documentation (`apps/api`) 🎛️

Hệ thống API Backend của **TrueSubmit** được phát triển trên nền tảng **NestJS (TypeScript)** và **Drizzle ORM** kết hợp **PostgreSQL**. Đây là bộ não điều phối dữ liệu, tiếp nhận bài nộp và phân phối công việc cho các Worker chấm bài.

---

## 🛠️ Tech Stack & Thư viện sử dụng
- **Framework**: NestJS (TypeScript)
- **Database ORM**: Drizzle ORM + Pg-driver (PostgreSQL)
- **API Giao tiếp Client**: tRPC Server (Type-safe API, không dùng REST URL)
- **API Giao tiếp Worker**: NestJS gRPC Microservice (chạy trên cổng 50051)
- **Cache & Queue Client**: Redis (IoRedis)
- **Giao tiếp Real-time**: Server-Sent Events (SSE) (NestJS hỗ trợ gốc qua RxJS)
- **Bảo mật & Rate Limit**: `@nestjs/throttler` (Chống spam nộp bài)
- **Xác thực**: JWT (JSON Web Token) + Passport

---

## 🏗️ Cấu trúc thư mục đề xuất (`apps/api`)

```text
apps/api/
├── src/
│   ├── main.ts                   # Điểm khởi chạy NestJS (Kích hoạt HTTP tRPC, SSE, và gRPC Microservice)
│   ├── app.module.ts             # Module gốc kết nối cơ sở dữ liệu, Redis, Auth và các sub-modules
│   │
│   ├── database/                 # Drizzle Connection & Bảng cơ sở dữ liệu
│   │   ├── schemas/              # Thiết kế schema dạng mô-đun hóa, chia nhỏ theo thực thể
│   │   │   ├── index.ts          # Re-export tất cả schema để import tập trung
│   │   │   ├── users.schema.ts   # Bảng người dùng (Admin & Student)
│   │   │   ├── problems.schema.ts # Bảng danh sách đề bài
│   │   │   ├── submissions.schema.ts # Bảng lưu trữ mã nguồn bài giải
│   │   │   ├── submission-results.schema.ts # Bảng chi tiết kết quả chấm bài
│   │   │   └── system-settings.schema.ts # Bảng cấu hình tham số hệ thống chạy sandbox
│   │   ├── database.provider.ts  # Nhà cung cấp kết nối PostgreSQL pool
│   │   ├── database.module.ts    # Module đóng gói database provider
│   │   └── migrations/           # Thư mục chứa các file SQL do Drizzle Kit sinh ra
│   │
│   ├── trpc/                     # Cổng tRPC API dành cho Frontend (Next.js)
│   │   ├── trpc.module.ts        # Module khởi tạo context và tích hợp tRPC vào NestJS
│   │   ├── trpc.router.ts        # Root Router kết hợp các sub-routers lại với nhau
│   │   ├── context.ts            # Tạo context cho mỗi request (chứa db, redis, user auth)
│   │   └── routers/              # Chứa các sub-routers nghiệp vụ
│   │       ├── auth.router.ts    # Đăng ký, đăng nhập
│   │       ├── problem.router.ts # Lấy thông tin đề bài
│   │       └── submission.router.ts # Gửi code bài giải
│   │
│   ├── grpc/                     # Cổng gRPC Microservice dành cho Worker (Golang)
│   │   ├── grpc.module.ts        # Module khởi tạo gRPC server
│   │   ├── submission.proto      # File hợp đồng Protobuf định nghĩa dịch vụ chấm điểm
│   │   └── submission.controller.ts # Controller nhận RPC `ReportResult` và cập nhật dữ liệu
│   │
│   ├── submissions/              # Module quản lý Bài nộp & luồng stream kết quả
│   │   ├── submissions.module.ts
│   │   ├── submissions.service.ts   # Xử lý logic và đẩy tin nhắn vào Redis Queue
│   │   └── submissions.controller.ts # Endpoint HTTP GET phục vụ luồng SSE đẩy điểm realtime
│   │
│   ├── problems/                 # Module quản lý đề thi và giới hạn tài nguyên
│   │   ├── problems.module.ts
│   │   └── problems.service.ts   # CRUD đề thi, testcase và giới hạn sandbox
│   │
│   ├── auth/                     # Module bảo mật và phân quyền người dùng
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts       # Hash mật khẩu, sinh mã JWT token
│   │   └── jwt.strategy.ts       # Passport Strategy kiểm tra tính hợp lệ của token
│   │
│   └── queue/                    # Module tích hợp Redis
│       ├── queue.module.ts
│       └── queue.service.ts      # Client IoRedis quản lý kết nối và đẩy job (LPUSH)
│
└── drizzle.config.ts             # File cấu hình sinh migration của Drizzle Kit
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

### 1. Tiếp nhận qua tRPC và Phản hồi cực nhanh (Low Latency Submission)
Khi sinh viên bấm "Nộp bài", client gọi tRPC mutation, NestJS API sẽ xử lý tối giản và phản hồi ngay lập tức:
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

### 4. gRPC Service nội bộ tiếp nhận kết quả chấm bài (Internal gRPC Service)
- Thiết lập gRPC Service chạy trên cổng mặc định `50051`.
- Triển khai hàm RPC `ReportResult(ResultRequest) returns (ResultResponse)` định nghĩa trong file Protobuf.
- Sử dụng Interceptor để đối sánh khóa bí mật `APP_INTERNAL_AUTH_TOKEN` nằm trong gRPC Metadata nhằm tránh sinh viên tự gửi giả lập kết quả.
- Khi nhận được dữ liệu, API thực hiện:
  1. Ghi nhận kết quả chấm bài chi tiết vào bảng `submission_results` thông qua Drizzle ORM.
  2. Đẩy sự kiện realtime tới luồng stream SSE tương ứng để cập nhật UI Next.js của sinh viên ngay lập tức.

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


