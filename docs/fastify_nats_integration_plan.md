# Kế hoạch tối ưu hóa API Gateway (Fastify) và Nâng cấp sang NATS JetStream

Tài liệu này vạch ra kế hoạch chi tiết để tối ưu hóa hiệu năng hệ thống **TrueSubmit** thông qua hai thay đổi cấu trúc lớn:
1. Chuyển đổi NestJS API Gateway từ Express sang **Fastify** nhằm tối ưu I/O và tăng thông lượng request.
2. Thay thế Redis Message Queue bằng **NATS JetStream** để nâng cao độ bền vững, hỗ trợ backpressure và phân phối tải thông minh hơn cho cụm Worker.

---

## 🚀 PHẦN 1: Tối ưu hóa NestJS API Gateway bằng Fastify

### 1. Cập nhật `main.ts` (`apps/backend/src/main.ts`)
Thay vì dùng Express mặc định, NestJS sẽ sử dụng `FastifyAdapter`.

**Thay đổi:**
- Import `FastifyAdapter` và `NestFastifyApplication` từ `@nestjs/platform-fastify`.
- Khởi tạo app bằng: `NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter())`.
- Cấu hình CORS bằng adapter tương thích Fastify hoặc sử dụng `@fastify/cors` đăng ký trực tiếp.

### 2. Cập nhật `context.ts` (`apps/backend/src/trpc/context.ts`)
Chuyển đổi kiểu Request và Response từ Express sang Fastify.

```typescript
import { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';

export type Context = Awaited<ReturnType<typeof createContext>>;

export function createContext({ req, res }: CreateFastifyContextOptions) {
  // req là FastifyRequest, res là FastifyReply
  const authHeader = req.headers.authorization;
  let user: any = null;
  
  // Xử lý xác thực Token...
  
  return { req, res, user };
}
```

### 3. Cập nhật `trpc.module.ts` (`apps/backend/src/trpc/trpc.module.ts`)
tRPC không thể dùng `expressMiddleware` trên nền Fastify. Chúng ta sẽ đăng ký tRPC thông qua Fastify plugin chính thức từ `@trpc/server/adapters/fastify`.

```typescript
import { Module, NestModule } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { TrpcRouter } from './trpc.router';
import { createContext } from './context';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [TrpcRouter],
  exports: [TrpcRouter],
})
export class TrpcModule implements NestModule {
  constructor(
    private readonly trpcRouter: TrpcRouter,
    private readonly adapterHost: HttpAdapterHost
  ) {}

  onModuleInit() {
    const httpAdapter = this.adapterHost.httpAdapter;
    const fastifyInstance = httpAdapter.getInstance();

    // Đăng ký tRPC Fastify Plugin
    fastifyInstance.register(fastifyTRPCPlugin, {
      prefix: '/trpc',
      useMiddie: false, // Chạy thuần Fastify (Không dùng Express shim để tối đa hiệu năng)
      trpcOptions: {
        router: this.trpcRouter.appRouter,
        createContext,
      },
    });
  }

  configure() {
    // Không cần dùng MiddlewareConsumer như cũ
  }
}
```

---

## ⚡ PHẦN 2: Nâng cấp Message Broker sang NATS JetStream

### 1. Luồng truyền tin mới (NATS JetStream Flow)
- **Stream**: `TRUESUBMIT` (Được lưu trữ bền vững trên NATS Server)
- **Subject**: `submissions.created`
- **Durable Consumer**: `worker-group` (Pull-based consumer để phân phối tải đều cho nhiều máy chủ Worker chạy song song).

### 2. Cập nhật NestJS Queue Service (`apps/backend/src/modules/queue/queue.service.ts`)
Chúng ta sẽ thay thế `ioredis` bằng thư viện `nats`. 

**Nhiệm vụ:**
- Kết nối tới NATS Server qua biến môi trường `APP_NATS_URL` (mặc định `nats://127.0.0.1:4222`).
- Khởi tạo Stream `TRUESUBMIT` nếu chưa tồn tại (Auto-provisioning).
- Hàm `pushSubmission` sẽ push message dưới dạng JetStream Publish (`js.publish(subject, payload)`).

### 3. Cập nhật Go Worker Queue Listener (`apps/worker/internal/queue/listener.go`)
Thay thế Redis Client bằng Go NATS Client (`github.com/nats-io/nats.go`).

**Kiến trúc Listener mới:**
- Sử dụng mô hình **Pull-based subscription**:
  - Worker sẽ kéo (Pull) các tin nhắn mới từ NATS Stream một cách chủ động theo cơ chế Batch (ví dụ: lấy 1 tin nhắn tại một thời điểm hoặc nhiều hơn dựa trên số lượng luồng xử lý trống).
  - Điều này giải quyết triệt để bài toán **Backpressure** (tránh tình trạng dồn dập hàng loạt request làm nghẽn Worker).
- Khi xử lý thành công, Worker sẽ phản hồi `Msg.Ack()` để NATS xác nhận xóa tin nhắn khỏi Stream. Nếu Worker gặp sự cố khi đang xử lý, tin nhắn tự động được gửi lại (redelivered) cho Worker khác sau một khoảng thời gian (Timeout).

---

## 📅 Các bước Triển khai & Kiểm thử (Verification Steps)

1. **Bước 1**: Áp dụng mã nguồn Fastify trong Backend và chạy `npm run check-types` để đảm bảo biên dịch thành công.
2. **Bước 2**: Khởi chạy NATS Server (sử dụng Docker Compose hoặc cài đặt local).
3. **Bước 3**: Cập nhật `QueueService` trong NestJS sử dụng NATS JetStream.
4. **Bước 4**: Cập nhật Go Worker chuyển từ Redis sang Pull-based NATS JetStream.
5. **Bước 5**: Chạy toàn bộ hệ thống ở local và thực thi một bài nộp test để chứng minh luồng kết nối end-to-end (tRPC $\rightarrow$ NestJS $\rightarrow$ NATS JetStream $\rightarrow$ Go Worker $\rightarrow$ gRPC $\rightarrow$ SSE) chạy mượt mà.
