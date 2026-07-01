# Backend API Documentation (`apps/api`) 🎛️

Hệ thống API Backend của **TrueSubmit** được phát triển trên nền tảng **NestJS (TypeScript)** và **Drizzle ORM** kết hợp **PostgreSQL**. Đây là bộ não điều phối dữ liệu, tiếp nhận bài nộp và phân phối công việc cho các Worker chấm bài.

---

## 🛠️ Tech Stack & Thư viện sử dụng
- **Framework**: NestJS (TypeScript)
- **Database ORM**: Drizzle ORM + Pg-driver (PostgreSQL)
- **API Giao tiếp Client**: tRPC Server (Type-safe API cho truy vấn/thao tác) & Server-Sent Events (SSE) (Cho luồng real-time stream kết quả)
- **API Giao tiếp Worker**: NestJS gRPC Microservice (Chạy trên cổng `50051`, nhận kết quả chấm từ Golang Worker)
- **Cache & Queue Client**: Redis (IoRedis) để lưu hàng đợi chấm bài
- **Bảo mật & Rate Limit**: `@nestjs/throttler` (Chống spam nộp bài)
- **Xác thực**: JWT (JSON Web Token) + Passport (RBAC)

--- 

## 🏗️ Cấu trúc thư mục đề xuất (`apps/api`)

```text
apps/api/
├── src/
│   ├── main.ts                   # Điểm khởi chạy NestJS (Kích hoạt HTTP tRPC, SSE, và gRPC Microservice cổng 50051)
│   ├── app.module.ts             # Module gốc kết nối cơ sở dữ liệu, Redis, Config, tRPC, gRPC và sub-modules
│   │
│   ├── database/                 # Drizzle Connection & Bảng cơ sở dữ liệu
│   │   ├── schemas/              # Thiết kế schema dạng mô-đun hóa, đồng bộ với database.md
│   │   │   ├── index.ts          # Re-export tất cả schema để import tập trung
│   │   │   ├── users.schema.ts   # Quản lý Người dùng, Vai trò & Phân quyền (RBAC)
│   │   │   ├── problems.schema.ts # Quản lý Đề bài & Tài nguyên
│   │   │   ├── contests.schema.ts # Quản lý Kỳ thi & Giám sát Chống gian lận
│   │   │   ├── submissions.schema.ts # Quản lý Bài nộp & Nhật ký làm bài
│   │   │   ├── cms.schema.ts      # Hệ thống Quản trị Nội dung - CMS & Media
│   │   │   ├── notifications.schema.ts # Quản lý Thông báo người dùng
│   │   │   ├── security.schema.ts # Chặn Truy cập & An ninh Hệ thống
│   │   │   ├── extensions.schema.ts # Cấu hình Tích hợp bên ngoài
│   │   │   ├── monitoring.schema.ts # Giám sát Hệ thống Chấm bài
│   │   │   ├── settings.schema.ts # Cấu hình Hệ thống
│   │   │   └── relations.ts      # Định nghĩa mối quan hệ tập trung giữa các bảng (Relations)
│   │   ├── database.provider.ts  # Nhà cung cấp kết nối PostgreSQL pool (POSTGRES_DB)
│   │   ├── database.module.ts    # Module đóng gói database provider toàn cục
│   │   └── migrations/           # Thư mục chứa các file SQL do Drizzle Kit sinh ra
│   │
│   ├── trpc/                     # Cổng tRPC API phục vụ Frontend (Next.js)
│   │   ├── trpc.module.ts        # Module khởi tạo context và tích hợp tRPC vào NestJS
│   │   ├── trpc.router.ts        # Root Router kết hợp các sub-routers lại với nhau
│   │   ├── context.ts            # Tạo context cho mỗi request tRPC (chứa db, redis, user auth)
│   │   └── routers/              # Chứa các sub-routers nghiệp vụ
│   │       ├── auth.router.ts    # Router đăng ký, đăng nhập
│   │       ├── user.router.ts    # Router hồ sơ cá nhân và nhóm
│   │       ├── problem.router.ts # Router lấy danh sách & chi tiết đề bài
│   │       ├── contest.router.ts # Router quản lý kỳ thi & thí sinh tham dự
│   │       ├── cms.router.ts     # Router lấy trang tĩnh, menu điều hướng
│   │       └── submission.router.ts # Router nộp bài giải
│   │
│   ├── grpc/                     # Cổng gRPC Microservice nhận kết quả từ Worker (Golang)
│   │   ├── grpc.module.ts        # Module khởi tạo gRPC server
│   │   ├── submission.proto      # File hợp đồng Protobuf định nghĩa dịch vụ chấm điểm
│   │   └── submission.controller.ts # Controller nhận RPC `ReportResult` và cập nhật dữ liệu
│   │
│   ├── modules/                  # Các module nghiệp vụ phụ trợ (không qua tRPC, ví dụ: SSE)
│   │   ├── submissions/          # Quản lý luồng stream kết quả SSE
│   │   │   ├── submissions.module.ts
│   │   │   ├── submissions.controller.ts # Chứa endpoint HTTP GET phục vụ luồng SSE đẩy điểm realtime
│   │   │   └── submissions.service.ts
│   │   ├── queue/                # Tích hợp Redis Queue kết nối tới Golang Worker
│   │   │   ├── queue.module.ts
│   │   │   └── queue.service.ts  # Quản lý kết nối Redis & chứa hàm LPUSH job nộp bài
│   │   └── auth/                 # Chứa JWT Strategy và logic hash mật khẩu dùng chung
│   │       ├── auth.module.ts
│   │       ├── auth.service.ts
│   │       └── strategies/
│   │           └── jwt.strategy.ts
│   │
│   └── shared/                   # Các hàm dùng chung, filters, interceptors, guards
│       ├── guards/
│       │   ├── rbac.guard.ts     # Guard kiểm tra quyền hạn động của người dùng
│       │   └── grpc-auth.guard.ts # Guard/Interceptor bảo vệ gRPC bằng token bí mật APP_INTERNAL_AUTH_TOKEN
│       └── interceptors/
│
└── drizzle.config.ts             # File cấu hình sinh migration của Drizzle Kit
```

---

## 🗄️ Database Schema (Drizzle ORM)

Chi tiết thiết kế cơ sở dữ liệu đã được tách riêng ra tài liệu: **[Database Schema Documentation](./database.md)**.
Vui lòng tham khảo file liên kết ở trên để xem chi tiết danh sách 10 file schema và các bảng tương ứng chứa bên trong.

---

## ⚡ Thiết kế xử lý Tải cao (1000 Sinh viên nộp bài đồng thời)

### 1. Tiếp nhận qua tRPC và Phản hồi cực nhanh (Low Latency Submission)
Khi thí sinh bấm "Nộp bài", client gọi tRPC mutation `submission.submit`, NestJS API sẽ xử lý tối giản và phản hồi ngay lập tức:
- **Không thực thi đồng bộ**: API **không tự chạy hay biên dịch code**, cũng không đợi Docker thực thi xong mới trả kết quả.
- **Quy trình xử lý cực nhanh (< 15ms)**:
  1. Validate định dạng dữ liệu đầu vào.
  2. Dùng Drizzle tạo mới một record `submission` trạng thái `PENDING` trong PostgreSQL.
  3. Lấy thông tin giới hạn tài nguyên của bài toán (thời gian tối đa, bộ nhớ RAM, CPU Cores) từ bảng `problems`.
  4. Đẩy một Job chứa thông tin `{ submissionId, language, code, timeLimit, memoryLimit, cpuLimit }` vào **Redis Queue** thông qua lệnh `LPUSH`.
  5. Trả ngay mã kết quả kèm theo `submissionId` cho frontend.

### 2. Sử dụng Drizzle ORM thay vì Prisma
- **Lý do**: Prisma sinh ra một engine Rust chạy ngầm có thể tiêu tốn thêm bộ nhớ RAM và có độ trễ khởi tạo truy vấn (Cold Start/Connection overhead).
- **Ưu điểm của Drizzle**: Drizzle hoạt động như một query builder thuần túy trên driver PostgreSQL, cho phép thực thi các câu lệnh SQL với tốc độ tối đa của driver nền, giảm thiểu thời gian CPU block của Node.js khi có hàng nghìn truy vấn đồng thời.

### 3. Rate Limiting ở API Layer
- Dùng `@nestjs/throttler` cấu hình giới hạn tần suất nộp bài của mỗi sinh viên (ví dụ: tối đa 1 lần nộp bài mỗi 10 giây). Điều này ngăn ngừa các hành vi viết script nộp bài spam liên tục làm sập queue hoặc cạn kiệt tài nguyên Docker Sandbox của Worker.
- Tận dụng Redis làm bộ nhớ lưu trữ rate limit để chia sẻ tải tốt hơn.

### 4. gRPC Service nội bộ tiếp nhận kết quả chấm bài (Internal gRPC Service)
- Thiết lập gRPC Service chạy trên cổng mặc định `50051`.
- Triển khai hàm RPC `ReportResult(ResultRequest) returns (ResultResponse)` định nghĩa trong file Protobuf.
- Sử dụng Interceptor/Guard để đối sánh khóa bí mật `APP_INTERNAL_AUTH_TOKEN` nằm trong gRPC Metadata nhằm tránh sinh viên tự gửi giả lập kết quả.
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
- **Tên hàng đợi (`SUBMISSION_QUEUE_NAME`)**: Code cứng trực tiếp chuỗi `"truesubmit_queue"` dùng chung cho cả NestJS và Golang Worker.
- **Thời gian hết hạn JWT (`JWT_EXPIRES_IN`)**: Cố định `"7d"`.
- **Khóa bảo mật JWT (`JWT_SECRET`)**: Sử dụng cơ chế fallback an toàn: `process.env.JWT_SECRET || 'fallback-secret-for-dev'`.
