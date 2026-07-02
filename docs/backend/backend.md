# Backend API Documentation (`apps/api`) 🎛️

Hệ thống API Backend của **TrueSubmit** được phát triển trên nền tảng **NestJS (TypeScript)** với adapter hiệu năng cao **Fastify**, kết hợp **Drizzle ORM** và **PostgreSQL**. Đây là bộ não điều phối dữ liệu, tiếp nhận bài nộp và phân phối công việc cho các Worker chấm bài.

---

## 🛠️ Tech Stack & Thư viện sử dụng
- **Framework**: NestJS + Fastify (TypeScript)
- **Database ORM**: Drizzle ORM + Pg-driver (PostgreSQL)
- **API Giao tiếp Client**: tRPC Server (đăng ký qua `fastifyTRPCPlugin`) & Server-Sent Events (SSE) (Cho luồng real-time stream kết quả)
- **API Giao tiếp Worker**: NestJS gRPC Microservice (Chạy trên cổng `50051`, nhận kết quả chấm từ Golang Worker)
- **Shared Constants Workspace**: Package `@repo/constants` (Dành cho việc chia sẻ enum Roles và Permissions giữa Frontend và Backend)
- **Message Broker & Queue**: NATS JetStream để quản lý hàng đợi và đảm bảo bền vững dữ liệu bài nộp
- **Bảo mật & Rate Limit**: `@nestjs/throttler` (Chống spam nộp bài)
- **Xác thực**: JWT (JSON Web Token) + Passport (RBAC)

--- 

## 🏗️ Cấu trúc thư mục đề xuất (`apps/api`)

```text
apps/api/
├── src/
│   ├── main.ts                   # Điểm khởi chạy NestJS (Kích hoạt Fastify Adapter, tRPC, SSE, và gRPC Microservice cổng 50051)
│   ├── app.module.ts             # Module gốc kết nối cơ sở dữ liệu, NATS, Config, tRPC, gRPC và sub-modules
│   │
│   ├── database/                 # Drizzle Connection & Bảng cơ sở dữ liệu
│   │   ├── schemas/              # Thiết kế schema dạng mô-đun hóa, đồng bộ với database.md
│   │   │   ├── index.ts          # Re-export tất cả schema để import tập trung
│   │   │   ├── users.schema.ts   # Quản lý Người dùng, Vai trò & Phân quyền (Quyền hạn được lưu trực tiếp dạng mảng)
│   │   │   ├── problems.schema.ts # Quản lý Đề bài & Tài nguyên
│   │   │   ├── contests.schema.ts # Quản lý Kỳ thi & Giám sát Chống gian lận
│   │   │   ├── submissions.schema.ts # Quản lý Bài nộp, kết quả chi tiết & báo cáo đạo văn
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
│   │   ├── trpc.module.ts        # Module khởi tạo context và tích hợp tRPC vào NestJS qua fastifyTRPCPlugin
│   │   ├── trpc.router.ts        # Root Router kết hợp các sub-routers lại với nhau
│   │   ├── context.ts            # Tạo context cho mỗi request tRPC (chứa db, nats, user auth)
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
│   ├── modules/                  # Các module nghiệp vụ
│   │   ├── submissions/          # Quản lý bài nộp
│   │   │   ├── submissions.module.ts
│   │   │   ├── submissions.controller.ts # Chứa endpoint HTTP GET phục vụ luồng SSE đẩy điểm realtime
│   │   │   ├── submissions.service.ts    # Xử lý nghiệp vụ chính (gửi hàng đợi, phân phối kết quả)
│   │   │   └── submissions.repository.ts # [Repository Pattern] Chứa các truy vấn Drizzle đọc/ghi bảng submissions
│   │   ├── queue/                # Tích hợp NATS JetStream kết nối tới Golang Worker
│   │   │   ├── queue.module.ts
│   │   │   └── queue.service.ts  # Quản lý kết nối NATS, tự khởi tạo Stream TRUESUBMIT và đẩy job
│   │   └── auth/                 # Chứa JWT Strategy và logic hash mật khẩu dùng chung
│   │       ├── auth.module.ts
│   │       ├── auth.service.ts
│   │       ├── auth.repository.ts   # [Repository Pattern] Thao tác DB trực tiếp của module Auth (bảng users)
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
Vui lòng tham khảo file liên kết ở trên để xem chi tiết danh sách các file schema và các bảng tương ứng chứa bên trong.

---

## 🗃️ Tầng Repository (Giao tiếp Database)

Để tách biệt hoàn toàn giữa Logic nghiệp vụ (Business Logic) và tầng dữ liệu, TrueSubmit áp dụng **Repository Pattern** kết hợp với Drizzle ORM:

### 1. Nguyên tắc hoạt động
- **Không viết Drizzle queries trực tiếp trong Service**: Các file `.service.ts` chỉ chứa luồng nghiệp vụ thuần túy (gửi queue, gọi các module khác, validate logic). Mọi thao tác truy vấn cơ sở dữ liệu (`db.select()`, `db.insert()`, `db.update()`, `db.delete()`) bắt buộc phải được đóng gói gọn gàng bên trong các file `.repository.ts` tương ứng.
- **Dependency Injection**: Lớp Repository sẽ tiêm (Inject) token `POSTGRES_DB` từ `DatabaseModule`. Sau đó, Service sẽ tiêm Repository này để gọi hàm.

### 2. Ví dụ chuẩn triển khai một Repository (`problems.repository.ts`)
```typescript
import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { POSTGRES_DB } from '@/database/database.provider';
import * as schemas from '@/database/schemas';
import { eq } from 'drizzle-orm';

@Injectable()
export class ProblemsRepository {
  constructor(
    @Inject(POSTGRES_DB) private readonly db: NodePgDatabase<typeof schemas>
  ) {}

  async findById(id: string) {
    return this.db
      .select()
      .from(schemas.problems)
      .where(eq(schemas.problems.id, id))
      .limit(1)
      .then((res) => res[0] || null);
  }

  async create(data: typeof schemas.problems.$inferInsert) {
    return this.db
      .insert(schemas.problems)
      .values(data)
      .returning();
  }
}
```

---

## ⚡ Thiết kế xử lý Tải cao (1000 Sinh viên nộp bài đồng thời)

### 1. Tiếp nhận qua tRPC và Phản hồi cực nhanh (Low Latency Submission)
Khi thí sinh bấm "Nộp bài", client gọi tRPC mutation `submission.submit`, NestJS API sẽ xử lý tối giản và phản hồi ngay lập tức:
- **Không thực thi đồng bộ**: API **không tự chạy hay biên dịch code**, cũng không đợi Docker thực thi xong mới trả kết quả.
- **Quy trình xử lý cực nhanh (< 10ms)**:
  1. Validate định dạng dữ liệu đầu vào.
  2. Dùng Drizzle tạo mới một record `submission` trạng thái `PENDING` trong PostgreSQL.
  3. Lấy thông tin giới hạn tài nguyên của bài toán (thời gian tối đa, bộ nhớ RAM, CPU Cores) từ bảng `problems`.
  4. Đẩy một Job chứa thông tin `{ submissionId, language, code, timeLimit, memoryLimit }` vào **NATS JetStream** qua subject `submissions.created`.
  5. Trả ngay mã kết quả kèm theo `submissionId` cho frontend.

### 2. Sử dụng Drizzle ORM thay vì Prisma
- **Lý do**: Prisma sinh ra một engine Rust chạy ngầm có thể tiêu tốn thêm bộ nhớ RAM và có độ trễ khởi tạo truy vấn (Cold Start/Connection overhead).
- **Ưu điểm của Drizzle**: Drizzle hoạt động như một query builder thuần túy trên driver PostgreSQL, cho phép thực thi các câu lệnh SQL với tốc độ tối đa của driver nền, giảm thiểu thời gian CPU block của Node.js khi có hàng nghìn truy vấn đồng thời.

### 3. Tối ưu khóa chính với UUIDv7
- Toàn bộ các bảng được cấu hình sử dụng **UUIDv7** làm khóa chính (sinh tự động qua Drizzle `$defaultFn`). Các ID này sắp xếp tăng dần theo thời gian (time-ordered), giúp giảm thiểu hiện tượng **Page Split** và phân mảnh trong chỉ mục B-Tree của PostgreSQL, duy trì tốc độ chèn dữ liệu nhanh ổn định kể cả khi database có hàng triệu bản ghi bài nộp.

### 4. Rate Limiting ở API Layer
- Dùng `@nestjs/throttler` cấu hình giới hạn tần suất nộp bài của mỗi sinh viên (ví dụ: tối đa 1 lần nộp bài mỗi 10 giây). Điều này ngăn ngừa các hành vi viết script nộp bài spam liên tục làm sập queue hoặc cạn kiệt tài nguyên Docker Sandbox của Worker.
- Tận dụng bộ nhớ trong (hoặc NATS KV) làm bộ nhớ lưu trữ rate limit để chia sẻ tải tốt hơn.

### 5. gRPC Service nội bộ tiếp nhận kết quả chấm bài (Internal gRPC Service)
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
| `APP_NATS_URL` | Chuỗi kết nối NATS Server (giao thức `nats://`) | `nats://127.0.0.1:4222` |
| `APP_INTERNAL_AUTH_TOKEN`| Token xác thực bảo mật kết nối từ Worker | `secure_internal_token_for_communication` |

### 📝 Các cấu hình được Code cứng / Fallback trong code:
- **Cổng Server (`PORT`) & Môi trường (`NODE_ENV`)**: Được xác định trực tiếp trong mã nguồn (mặc định port `3001` cho dev và tự động nhận dạng môi trường).
- **Cấu hình CORS (`CORS_ORIGIN`)**: Sử dụng một **mảng các domain được phép** khai báo trực tiếp trong `main.ts` (ví dụ: `['http://localhost:3000', 'https://truesubmit.yourdomain.com']`). Điều này loại bỏ hoàn toàn việc phải cấu hình CORS thủ công qua file `.env`.
- **Tên Stream / Hàng đợi**: Stream `"TRUESUBMIT"`, Subject `"submissions.created"` được sử dụng nhất quán cho cả NestJS và Go Worker.
- **Thời gian hết hạn JWT (`JWT_EXPIRES_IN`)**: Cố định `"7d"`.
- **Khóa bảo mật JWT (`JWT_SECRET`)**: Sử dụng cơ chế fallback an toàn: `process.env.JWT_SECRET || 'fallback-secret-for-dev'`.

---

## 🛠️ Tính năng Configuration Wizard (Khởi tạo hệ thống)

Phía Backend hỗ trợ cơ chế kiểm tra trạng thái khởi tạo và bảo vệ các API nghiệp vụ khác:

### 1. Tổ chức Module (`src/modules/configuration/`)
- **ConfigurationModule**: Đóng gói logic liên quan đến thiết lập ban đầu.
  - `ConfigurationService`: Kiểm tra trạng thái cài đặt hệ thống (ví dụ: quét xem có tài khoản Admin nào tồn tại trong database chưa, hoặc kiểm tra cờ trạng thái trong cấu hình).
  - `ConfigurationController` / `ConfigurationRouter`: Cung cấp các API:
    - `GET /configuration/status`: Lấy trạng thái cài đặt (`{ isInitialized: boolean }`).
    - `POST /configuration/initialize`: Tiếp nhận thông số cấu hình và thông tin tài khoản root admin, thực thi migrate database và tạo tài khoản.

### 2. Guard bảo vệ toàn cục (`SystemInitializedGuard`)
- Vị trí: `src/shared/guards/system-initialized.guard.ts` (hoặc `src/modules/configuration/guards/`).
- Nguyên lý hoạt động:
  - Cho phép bỏ qua kiểm tra đối với các API thuộc `/configuration/*`.
  - Đối với tất cả các API khác (tRPC, HTTP, gRPC): Nếu hệ thống chưa hoàn thành cấu hình, Guard sẽ chặn lại và ném ra mã lỗi tùy chỉnh `{ code: 'CONFIGURATION_REQUIRED' }` để yêu cầu Frontend chuyển hướng.
  - Tận dụng **in-memory cache (hoặc NATS Key-Value)** lưu cờ trạng thái `system_initialized: true` sau khi cấu hình thành công, giúp việc xác thực của Guard diễn ra cực kỳ nhanh (< 1ms) và tránh truy vấn Database liên tục.
