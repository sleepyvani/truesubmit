# TrueSubmit - Tổng Quan Kiến Trúc Hệ Thống 🚀

TrueSubmit là hệ thống chấm bài trực tuyến (Online Judge) hiệu năng cao, được thiết kế để giải quyết bài toán **1000 sinh viên nộp bài đồng thời trong 1 giờ thi** với tốc độ biên dịch cực nhanh (sub-50ms) và phản hồi kết quả tức thời.

Để loại bỏ hoàn toàn sự phức tạp của việc định nghĩa URL truyền thống (REST API) và tăng tốc độ truyền tải dữ liệu, hệ thống sử dụng các công nghệ tiên tiến nhất năm 2026: **tRPC**, **gRPC**, **Redis Queue**, và **Server-Sent Events (SSE)**.

---

## 🏗️ Sơ đồ Kiến trúc & Luồng Dữ liệu (Workflow)

```mermaid
sequenceDiagram
    autonumber
    actor SinhVien as Sinh viên
    participant Web as "Next.js Web (Frontend)"
    participant API as "NestJS API (Gateway)"
    participant Redis as Redis Queue
    participant Worker as "Golang Worker (Chấm bài)"
    participant Sandbox as "Docker Sandbox (RAMDisk)"
    participant DB as "PostgreSQL (Drizzle)"

    SinhVien->>Web: Nhập code & nhấn "Nộp bài"
    Web->>API: 1. Gửi bài nộp qua tRPC Mutation (Không URL)
    activate API
    API->>DB: 2. Lưu trạng thái PENDING & Đọc giới hạn bài toán
    API->>Redis: 3. Đẩy Job vào Queue (LPUSH)
    API-->>Web: 4. Trả về Submission ID
    deactivate API

    Web->>API: 5. Mở kết nối SSE lắng nghe kết quả
    activate API

    Redis->>Worker: 6. Nhận Job bất đồng bộ (BRPOP)
    activate Worker
    Worker->>Sandbox: 7. Lấy Container Ấm (Warm Pool) & Mount RAMDisk (tmpfs)
    Worker->>Sandbox: 8. Sao chép code và chạy (Docker SDK)
    Sandbox-->>Worker: 9. Trả về Standard Output (stdout)
    Worker->>Worker: 10. So sánh output với Testcase
    Worker->>API: 11. Báo kết quả qua gRPC (Xác thực Metadata Token)
    deactivate Worker

    API->>DB: 12. Cập nhật trạng thái bài chấm (Drizzle)
    API-->>Web: 13. Đẩy kết quả realtime qua luồng Stream SSE
    deactivate API
    Web-->>SinhVien: 14. Hiển thị kết quả chấm (AC / WA / TLE / MLE)
```

---

## ⚡ 4 Trụ Cột Giao Tiếp Hiện Đại (Không Sử Dụng REST Endpoint)

### 1. tRPC (Giao tiếp Frontend $\leftrightarrow$ Backend)
* **Mục đích**: Loại bỏ hoàn toàn việc định nghĩa URL, HTTP Methods, và viết API Callers thủ công ở phía Client.
* **Chi tiết kỹ thuật**:
  - **Backend (NestJS Router Definition)**:
    ```typescript
    // apps/api/src/trpc/routers/submission.router.ts
    import { router, publicProcedure } from '../trpc';
    import { z } from 'zod';

    export const submissionRouter = router({
      submit: publicProcedure
        .input(z.object({
          problemId: z.string().uuid(),
          code: z.string().min(1),
          language: z.enum(['c', 'cpp', 'csharp', 'java', 'python', 'go', 'zig'])
        }))
        .mutation(async ({ input, ctx }) => {
          const submission = await ctx.db.insert(submissions).values({
            userId: ctx.user.id,
            problemId: input.problemId,
            code: input.code,
            language: input.language,
            status: 'PENDING'
          }).returning();

          // Truy vấn cấu hình tài nguyên của bài toán
          const problem = await ctx.db.query.problems.findFirst({
            where: eq(problems.id, input.problemId)
          });

          // Đẩy vào Redis Queue bất đồng bộ
          await ctx.redis.lpush('truesubmit_queue', JSON.stringify({
            submissionId: submission[0].id,
            code: input.code,
            language: input.language,
            timeLimitMs: problem.timeLimitMs,
            memoryLimitMb: problem.memoryLimitMb,
            cpuCores: problem.cpuCores
          }));

          return { submissionId: submission[0].id };
        })
    });
    ```
  - **Frontend (Next.js Call)**:
    ```typescript
    // apps/web/app/problems/[id]/workspace.tsx
    import { trpc } from '@/lib/trpc';

    const { mutateAsync: submitCode, isLoading } = trpc.submission.submit.useMutation();

    const handleSubmit = async () => {
      const result = await submitCode({
        problemId: 'uuid-1234',
        code: '// mã nguồn của học sinh...',
        language: 'cpp'
      });
      // Kết quả type-safe, autocomplete thuộc tính 'submissionId'
      console.log('Submission Created:', result.submissionId);
    };
    ```

### 2. Redis Queue (Giảm chấn tải cao)
* **Mục đích**: Bộ đệm trung gian lưu trữ các Job chấm bài để Worker xử lý tuần tự/song song theo tài nguyên cho phép, bảo vệ Go Worker không bị sập vì tạo quá nhiều Docker Sandbox cùng lúc.
* **Chi tiết cấu trúc Payload (Job Format)**:
  Mỗi Job được đẩy lên hàng đợi `truesubmit_queue` dưới dạng chuỗi JSON có cấu trúc như sau:
  ```json
  {
    "submissionId": "f789d98e-4a6c-48d9-952b-87d3a01bf280",
    "code": "#include <iostream>\nusing namespace std;\nint main() { cout << \"Hello World\"; return 0; }",
    "language": "cpp",
    "timeLimitMs": 1000,
    "memoryLimitMb": 256,
    "cpuCores": 0.5
  }
  ```

### 3. gRPC (Giao tiếp Worker $\rightarrow$ Backend)
* **Mục đích**: Truyền tải kết quả chấm từ Golang Worker về NestJS API với độ trễ cực thấp, tiết kiệm băng thông và đảm bảo an toàn tuyệt đối thông qua gRPC Metadata.
* **Chi tiết Protobuf Contract (`submission.proto`)**:
  ```protobuf
  syntax = "proto3";

  package submission;

  option go_package = "truesubmit/worker/internal/pb";

  service SubmissionService {
    rpc ReportResult (ReportResultRequest) returns (ReportResultResponse);
  }

  message ReportResultRequest {
    string submissionId = 1;
    string status = 2; // AC, WA, TLE, MLE, RE, CE
    int64 timeTakenMs = 3;
    string errorLog = 4;
    string token = 5; // Internal auth token
  }

  message ReportResultResponse {
    bool success = 1;
    string message = 2;
  }
  ```
* **Chi tiết mã hóa Golang Client gọi gRPC**:
  ```go
  // apps/worker/main.go
  req := &pb.ReportResultRequest{
      SubmissionId: job.SubmissionID,
      Status:       finalStatus,
      TimeTakenMs:  totalTimeTaken.Milliseconds(),
      ErrorLog:     detailedErrorLog,
      Token:        token,
  }

  for retry := 1; retry <= 3; retry++ {
      resp, err := grpcClient.ReportResult(ctx, req)
      if err == nil && resp.Success {
          log.Printf("[Sub #%s] Successfully reported result to backend: %s\n", job.SubmissionID, resp.Message)
          break
      }
      log.Printf("[Sub #%s] Failed reporting result to backend (Attempt %d/3): %v\n", job.SubmissionID, retry, err)
      time.Sleep(1 * time.Second)
  }
  ```

### 4. Server-Sent Events - SSE (Real-time Stream đẩy điểm)
* **Mục đích**: Thay vì Client gửi hàng nghìn request kéo thông tin liên tục (Polling), Server sẽ giữ kết nối và đẩy trạng thái cập nhật xuống cho Client ngay khi có sự thay đổi.
* **Chi tiết định dạng Raw Event-Stream**:
  Khi client Next.js kết nối đến `/api/submissions/:id/sse`, NestJS sẽ mở một Stream HTTP dạng `text/event-stream` và đẩy dữ liệu:
  ```http
  HTTP/1.1 200 OK
  Content-Type: text/event-stream
  Cache-Control: no-cache
  Connection: keep-alive

  event: status-change
  data: {"status": "RUNNING"}

  event: status-change
  data: {"status": "COMPLETED", "verdict": "AC", "time": 45, "memory": 2048}
  ```

---

## 🔒 Cơ chế Sandbox của Worker
Để bảo đảm mã nguồn của sinh viên không gây nguy hiểm hoặc ảnh hưởng đến máy chủ vật lý:
1. **Docker Container Isolation**: Chạy mỗi bài biên dịch bên trong một container Docker được cấu hình `--network none` (hoàn toàn ngắt kết nối Internet để tránh sinh viên viết code spam request ra ngoài).
2. **Warm Pool (Tối ưu <50ms)**: Worker giữ sẵn các container biên dịch (GCC, Python, Go) ở chế độ ngủ (Idle), sao chép code vào chạy trực tiếp và dọn dẹp sạch sẽ sau khi dùng xong, thay vì khởi tạo container mới từ đầu.
3. **RAMDisk (Tmpfs Mount)**: Mount thư mục làm việc của Container trực tiếp trên bộ nhớ RAM vật lý để loại bỏ nghẽn I/O ổ cứng và tăng tốc độ biên dịch tối đa.
4. **Cgroups Limits**: Áp đặt giới hạn RAM (`256MB`), CPU (`0.5 Cores`) và PIDs limit (`20` - chống Fork Bomb) được cấu hình động theo từng đề bài.

---

## 🗄️ 5. Thiết Kế Cơ Sở Dữ Liệu (Database Schema)

Hệ thống sử dụng Drizzle ORM kết hợp PostgreSQL để quản lý các bảng cốt lõi. Để đảm bảo tính mở rộng và dễ bảo trì, thay vì dồn tất cả các bảng vào một file đơn lẻ, toàn bộ schema được tách nhỏ thành các module riêng biệt trong thư mục `apps/api/src/database/schemas/` (bao gồm `users.schema.ts`, `problems.schema.ts`, `submissions.schema.ts`, `submission-results.schema.ts`, `system-settings.schema.ts`) và được re-export tập trung qua `index.ts`:

```mermaid
erDiagram
    users {
        uuid id PK
        string email
        string password_hash
        string role "admin | student"
    }
    problems {
        uuid id PK
        string title
        text description
        integer time_limit_ms
        integer memory_limit_mb
        float cpu_cores
    }
    submissions {
        uuid id PK
        uuid user_id FK
        uuid problem_id FK
        string language
        text code
        string status "PENDING | RUNNING | COMPLETED"
    }
    submission_results {
        uuid id PK
        uuid submission_id FK
        string verdict "AC | WA | TLE | MLE | CE"
        integer execution_time_ms
        integer execution_memory_kb
        text compiler_message
    }
    system_settings {
        string key PK
        string value
        string description
    }

    users ||--o{ submissions : "makes"
    problems ||--o{ submissions : "has"
    submissions ||--|| submission_results : "produces"
```

### ⚙️ Cấu hình động cho Admin (Dynamic Settings & Extensions)
Hệ thống sử dụng cơ chế cấu hình động được lưu trữ hoàn toàn dưới dạng dữ liệu định kiểu (TypeScript Interfaces) trong cơ sở dữ liệu để dễ dàng hiển thị lên giao diện **Configuration Wizard**:

#### 1. Cấu hình Hệ thống (`system_settings`)
Lưu trữ thông số hoạt động cốt lõi của nền tảng với các khóa trong enum `SystemSettingKey`:
* **`sandbox_limits`** (`SandboxLimitsConfig`): Giới hạn CPU Cores, RAM tối đa (MB), thời gian chạy tối đa (ms), dung lượng tệp code tối đa (MB) mặc định của Sandbox.
* **`allowed_languages`** (`string[]`): Danh sách định danh các ngôn ngữ lập trình được phép nộp bài (C, C++, Java, Python, Go, Rust, JavaScript, TypeScript).
* **`system_status`** (`SystemStatusConfig`): Cờ trạng thái bảo trì (`maintenanceMode`), mở đăng ký tài khoản (`registrationOpen`), kích hoạt hàng đợi chấm (`submissionQueueEnabled`).
* **`submission_limits`** (`SubmissionLimitsConfig`): Dung lượng mã nguồn tối đa (KB), thời gian tối thiểu giữa các lần nộp (rate limit), số lượng nộp tối đa/ngày trên mỗi tài khoản.
* **`worker_queue`** (`WorkerQueueConfig`): Số lượng job song song tối đa mỗi worker, số lần thử lại khi container lỗi, chu kỳ heartbeat của worker, và khóa xác thực kết nối gRPC nội bộ (`workerSecretToken`).
* **`website_metadata`** (`WebsiteMetadataConfig`): SEO Metadata (Tiêu đề, mô tả, từ khóa, OpenGraph), logo, favicon, email hỗ trợ (`contactEmail`), và liên kết mạng xã hội (`socialLinks`).

#### 2. Cấu hình Dịch vụ Tích hợp (`extensions` & `extension_configs`)
Quản lý các module tích hợp mở rộng, định nghĩa trong enum `ExtensionKey`:
* **`media_storage`** (`MediaStorageConfig`): Cấu hình nơi lưu trữ media (Local, AWS S3, Cloudflare R2, Tigris) tích hợp sẵn tính năng tiền xử lý hình ảnh (`imageProcessing` bao gồm tự động nén, chuyển sang WebP, loại bỏ metadata) và giới hạn dung lượng tải lên.
* **`problem_storage`** (`ProblemStorageConfig`): Nơi lưu trữ bộ dữ liệu testcase, code mẫu (Local, AWS S3, Cloudflare R2, Tigris).
* **`authentication`** (`AuthenticationConfig`): Cấu hình Better Auth (Secret key, base URL, bật/tắt Email-Password, OAuth Google/GitHub/Discord/GitLab, các plugins Two-Factor/Passkey).
* **`captcha`** (`CaptchaConfig`): Bật/tắt Cloudflare Turnstile, Google reCAPTCHA, hCaptcha và khai báo các action bắt buộc phải xác thực (`requiredOn` như đăng ký, đăng nhập, nộp bài).
* **`analytics_marketing`** (`AnalyticsMarketingConfig`): Google Analytics (GA4) và Google Ads Remarketing.
* **`security_settings`** (`SecuritySettingsConfig`): Tự động phòng chống spam IP, brute force khóa tài khoản, bảo vệ phiên đăng nhập (chặn đa phiên, phát hiện thay đổi IP/User-Agent).
* **`system_notification`** (`NotificationConfig`): Thiết lập các cổng gửi tin SMTP (Email), Telegram Bot, Discord Webhook, Slack Webhook và đăng ký kích hoạt theo từng sự kiện hệ thống (`triggers` như đăng ký, đổi mật khẩu, nộp bài).

---

## 📂 6. Cấu Trúc Monorepo (`truesubmit`)

```text
truesubmit/
├── apps/
│   ├── web/                 # Next.js Application (Port 3000)
│   ├── api/                 # NestJS API Gateway & gRPC/tRPC Server (Port 3001, gRPC Port 50051)
│   └── worker/              # Golang Worker (Chạy daemon chấm bài với Docker SDK)
├── docs/                    # Tài liệu kiến trúc hệ thống
│   ├── api/
│   ├── web/
│   ├── worker/
│   └── overview.md          # Tài liệu tổng quan (File này)
└── package.json             # Cấu hình workspace Monorepo npm
```

---

## 🚀 7. Hướng Dẫn Khởi Chạy Nhanh (Quick Start)

### Bước 1: Khởi động Cơ sở dữ liệu và Redis
Chạy Docker Compose để khởi chạy PostgreSQL và Redis:
```bash
docker compose up -d
```

### Bước 2: Thiết lập Database Schema & Migrations
Di chuyển vào thư mục `apps/api` và chạy lệnh Drizzle:
```bash
cd apps/api
npm install
npx drizzle-kit push
```

### Bước 3: Khởi chạy 3 ứng dụng đồng thời

1. **Khởi chạy NestJS API Gateway**:
   ```bash
   cd apps/api
   npm run dev
   # Server lắng nghe tRPC tại cổng 3001 và gRPC tại cổng 50051
   ```

2. **Khởi chạy Next.js Frontend**:
   ```bash
   cd apps/web
   npm run dev
   # Truy cập ứng dụng tại http://localhost:3000
   ```

3. **Khởi chạy Golang Worker**:
   ```bash
   cd apps/worker
   go run main.go
   # Worker kết nối đến Redis Queue và sẵn sàng gọi gRPC trả kết quả
   ```
