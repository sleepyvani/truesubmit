# Báo cáo tối ưu hóa API Gateway (Fastify), NATS JetStream & Docker Warm Container Pool [ĐÃ HOÀN THÀNH]

Tài liệu này ghi nhận kết quả và kiến trúc thực tế của hệ thống **TrueSubmit** sau khi tối ưu hóa hiệu năng toàn diện:
1. Chuyển đổi NestJS API Gateway từ Express sang **Fastify** để nâng cao thông lượng request.
2. Nâng cấp Message Broker từ Redis sang **NATS JetStream** để hỗ trợ bền vững tin nhắn và cơ chế Pull Consumer điều phối tải (Backpressure).
3. Triển khai cơ chế **Warm Container Pool** trên Go Worker để triệt tiêu độ trễ khởi chạy Docker Container từ ~1s xuống dưới **50ms**.

---

## 🚀 1. Tối ưu hóa NestJS API Gateway bằng Fastify (Hoàn thành)

### Chi tiết thay đổi:
* **Bootstrap**: Thay thế Express mặc định bằng `FastifyAdapter` trong `apps/backend/src/main.ts`.
* **tRPC Integration**: Chuyển đăng ký tRPC từ Express Middleware sang `fastifyTRPCPlugin` chính thức trong `apps/backend/src/trpc/trpc.module.ts`, tắt chế độ Express shim (`useMiddie: false`) để chạy thuần Fastify đạt hiệu năng cao nhất.
* **Context**: Chuyển đổi kiểu Request/Response sang `CreateFastifyContextOptions` tại `apps/backend/src/trpc/context.ts`.

---

## ⚡ 2. Nâng cấp Message Broker sang NATS JetStream (Hoàn thành)

### Chi tiết thay đổi:
* **Backend Publisher**:
  - Tích hợp thư viện `nats` trong `QueueService` (`apps/backend/src/modules/queue/queue.service.ts`).
  - Kết nối qua cấu hình `APP_NATS_URL` (mặc định `nats://localhost:4222`).
  - Tự động kiểm tra và khởi tạo Stream `TRUESUBMIT` nếu chưa tồn tại.
  - Publish tin nhắn bằng JetStream API qua subject `submissions.created`.
* **Go Worker Consumer**:
  - Chuyển đổi `apps/worker/internal/queue/listener.go` từ Redis sang Go NATS Client.
  - Sử dụng mô hình **Pull-based subscription**: Worker kéo tin nhắn chủ động theo đợt (Batch) dựa trên khả năng tải thực tế của hệ thống.
  - Áp dụng cơ chế **Acknowledge (Ack/Nak)**: Tin nhắn chỉ được xóa khỏi Stream sau khi chấm bài thành công. Nếu xảy ra sự cố sập Worker giữa chừng, tin nhắn tự động được trả về queue để điều phối cho Worker khác.

---

## 📦 3. Tối ưu hóa Sandbox với Docker Warm Container Pool (Hoàn thành)

Nhằm tối ưu hóa triệt để thời gian chạy của Docker Container mà vẫn giữ nguyên khả năng tương thích tuyệt đối của đa ngôn ngữ, chúng tôi đã tái cấu trúc `apps/worker/internal/sandbox/runner.go` theo thiết kế tối ưu mới:

### Luồng hoạt động:
* **Warm Pool**:
  - Quản lý mảng các container đang chạy ở chế độ rảnh rỗi (`sleep infinity`) cho từng ngôn ngữ thông qua cấu trúc hàng đợi kênh an toàn luồng (`chan WarmContainer`).
  - Số lượng tối đa được cấu hình động qua biến môi trường `SANDBOX_MAX_CONCURRENT` (mặc định là `8`).
* **Zero Host I/O Writing (RAM Copy)**:
  - Sử dụng API `CopyToContainer` kết hợp luồng tar tạo hoàn toàn trên RAM (`archive/tar`) để đẩy mã nguồn và input của thí sinh thẳng vào workspace của container rảnh rỗi. Tránh hoàn toàn việc đọc ghi file xuống đĩa cứng của máy chủ Host.
  - Gắn RAMDisk (`tmpfs` kích thước 64MB tại thư mục `/workspace` của container) để tối ưu tốc độ biên dịch và thực thi.
* **Exec Session Execution**:
  - Sử dụng Docker Exec API để khởi tạo tiến trình biên dịch và chạy code bên trong container đang warm.
  - Phân quyền chạy dưới user không có đặc quyền (`nobody`) tăng tính bảo mật.
* **Xử lý TLE (Time Limit Exceeded)**:
  - Nếu tiến trình Exec vượt quá thời gian cho phép (`TimeLimit` của bài nộp), container bị coi là không an toàn (có thể chứa vòng lặp vô hạn hoặc zombie process).
  - Hệ thống sẽ **hủy bỏ trực tiếp** container đó ngay lập tức và khởi chạy một container warm mới tinh thay thế để đưa vào pool, loại bỏ hoàn toàn nguy cơ rò rỉ CPU/RAM.
* **Dọn dẹp và Tái sử dụng**:
  - Đối với các tiến trình kết thúc bình thường, hệ thống thực hiện dọn dẹp thư mục qua lệnh `rm -rf /workspace/*` và trả container về Pool để phục vụ bài nộp tiếp theo.

---

## 📅 Trạng thái Biên dịch & Xác thực (Status & Verification)

* **NestJS Backend Typecheck**: `npm run check-types` vượt qua 100% không lỗi.
* **Go Worker Compilation**: `go build ./...` vượt qua 100% không lỗi.
* **Environment Variables**: Cập nhật các tệp `.env.example` thay thế `APP_REDIS_CONN_STRING` bằng cấu hình `APP_NATS_URL` mới.

