# Execution Engine Worker Documentation (`apps/worker`) ⚙️

Ứng dụng **Worker** là thành phần cốt lõi chịu trách nhiệm chấm bài của hệ thống **TrueSubmit**. Được phát triển hoàn toàn bằng ngôn ngữ **Golang**, Worker tận dụng tối đa khả năng xử lý song song (concurrency) vượt trội và hiệu năng cao để biên dịch, thực thi mã nguồn trong môi trường Sandbox an toàn.

---

## 🛠️ Tech Stack & Thư viện sử dụng
- **Language**: Golang (phiên bản 1.25 trở lên)
- **Container SDK**: Official Docker Go SDK (`github.com/docker/docker/client`)
- **Queue Client**: NATS Go Client (`github.com/nats-io/nats.go`) kết nối NATS JetStream
- **gRPC Library**: Google gRPC Client (`google.golang.org/grpc`) để báo cáo kết quả chấm bài trực tiếp về NestJS.

---

## 🏗️ Kiến trúc & Luồng xử lý của Worker

```text
apps/worker/
├── internal/
│   ├── pb/              # Các file sinh ra từ protobuf (submission.pb.go, submission_grpc.pb.go)
│   ├── queue/           # Quản lý kết nối và lắng nghe NATS JetStream Pull Subscription
│   └── sandbox/         # Quản lý Docker SDK (Warm Container Pool, tmpfs, copy RAM-based Tar)
├── main.go              # Điểm khởi chạy (Khởi tạo kết nối NATS, bắt đầu vòng lặp Pull Consumer, và báo kết quả gRPC)
└── go.mod               # Khai báo dependency của Golang
```

### Luồng xử lý chi tiết của 1 Job chấm bài:
1. **Lắng nghe**: Worker sử dụng NATS JetStream **Pull Consumer** với phương thức `Fetch` để chủ động lấy tin nhắn bài nộp theo lô (batch) từ subject `submissions.created`. Cơ chế này cho phép worker kiểm soát áp lực xử lý (backpressure) cực kỳ tốt dựa trên giới hạn concurrent chạy song song.
2. **Lấy Sandbox ấm**: Thay vì gọi `docker run` tạo mới container tốn 1-2s, Worker lấy một container ấm đã được khởi chạy sẵn từ Pool (`chan WarmContainer`). Nếu không có sẵn container phù hợp (ví dụ: RAM yêu cầu lớn hơn cấu hình của container hiện tại), container không khớp sẽ bị hủy và một container mới có cấu hình phù hợp sẽ được khởi tạo.
3. **Ghi code bằng RAM tar stream**: Để tránh I/O ghi đĩa trên máy chủ, mã nguồn được đóng gói thành một tar stream dạng in-memory buffer, sau đó chèn trực tiếp vào container thông qua API `CopyToContainer` của Docker SDK. Thư mục `/workspace` trong container được mount dưới dạng RAMDisk (`tmpfs`).
4. **Biên dịch & Thực thi (Compile & Run)**:
   - Thực thi các lệnh biên dịch và chạy code của thí sinh bên trong container bằng API `ContainerExecCreate` và `ContainerExecStart`.
   - Giám sát thời gian chạy (Time Limit) và RAM tiêu thụ (Memory Limit).
5. **So sánh (Judge)**: So sánh đầu ra chuẩn (`stdout`) thu được với kết quả kỳ vọng (`expected output`).
6. **Trả kết quả & Acknowledge**:
   - Gọi RPC `ReportResult` của `SubmissionService` đến NestJS thông qua gRPC.
   - Nếu NestJS xác nhận lưu kết quả thành công, Worker gọi `msg.Ack()` để báo cho NATS JetStream xóa tin nhắn khỏi hàng đợi.
   - Nếu có lỗi truyền thông gRPC hoặc lỗi hệ thống đột ngột xảy ra, tin nhắn không được Ack (hoặc được `Nak()`), NATS JetStream sẽ tự động gửi lại tin nhắn cho các Worker khác xử lý sau khoảng thời gian cấu hình.

---

## ⚡ Tối ưu hiệu năng cho kịch bản Tải cao (1000 Sinh viên)

Để đạt tốc độ compile và trả phản hồi cực nhanh khi có hàng ngàn bài nộp đồng thời:

### 1. Kỹ thuật Bể chứa Container sẵn sàng (Warm Container Pooling)
- **Giải pháp**: Worker duy trì một **Pool các Container chạy sẵn ở chế độ chờ (Idle Warm Containers)** (`chan WarmContainer`). Khi có bài nộp:
  1. Worker lấy một container trống từ Pool.
  2. Copy file code vào container bằng tar stream hoàn toàn trên RAM.
  3. Thực thi lệnh biên dịch/chạy và đọc stdout trực tiếp.
  4. Sau khi chạy xong, dọn dẹp thư mục làm việc `/workspace` để trả container về Pool.
  5. **Xử lý TLE & An toàn**: Nếu container bị chạy quá thời gian giới hạn (TLE) hoặc gặp sự cố bất thường, container đó sẽ bị phá hủy hoàn toàn (Destroy) để đảm bảo không rò rỉ bộ nhớ hay tiến trình rác, đồng thời một container ấm mới tinh được khởi tạo để bổ sung vào Pool.
  6. *Kết quả*: Thời gian khởi chạy giảm xuống chỉ còn **dưới 50ms**.

### 2. Sử dụng Bộ nhớ RAM ảo (Tmpfs Mount) & In-memory Tar
- **Giải pháp**: Cấu hình Docker để mount thư mục làm việc của sinh viên trong container dưới dạng `tmpfs` (RAMDisk). Đồng thời, dữ liệu code truyền vào container được chuyển bằng luồng dữ liệu RAM (tar stream), thay vì ghi file tạm xuống ổ đĩa của host.
- **Lợi ích**: Toàn bộ quá trình ghi mã nguồn, biên dịch ra file thực thi và ghi file đầu ra tạm thời đều diễn ra hoàn toàn trên bộ nhớ RAM thay vì ghi xuống ổ cứng SSD/HDD vật lý. Điều này loại bỏ hoàn toàn nút thắt cổ chai về tốc độ đọc ghi đĩa (I/O Bottleneck).

### 3. Điều phối luồng xử lý (Concurrency Control bằng Go Goroutine)
- Worker cấu hình số lượng concurrency tối đa chạy song song qua tham số `SANDBOX_MAX_CONCURRENT`. Mỗi job được kéo về từ NATS JetStream sẽ được xử lý độc lập bởi một Goroutine trong giới hạn này.
- Điều này đảm bảo CPU của máy chủ không bị quá tải dẫn đến tình trạng treo máy khi 1000 bài nộp đổ về cùng một lúc. Các bài nộp vượt quá khả năng xử lý tức thời sẽ nằm chờ an toàn trong NATS JetStream với cơ chế hàng đợi phân tán cực kỳ bền vững.

---

## 🔒 Cơ chế Bảo mật Sandbox

Vì mã nguồn của sinh viên có thể chứa mã độc hại hoặc lỗi vô hạn, môi trường Sandbox được cô lập ở mức tối đa:
- **Ngắt kết nối mạng**: Cấu hình container với `--network none` để code không thể gửi dữ liệu ra Internet hoặc quét cổng mạng nội bộ của trường học.
- **Giới hạn tài nguyên phần cứng**:
  - Giới hạn RAM bằng cgroups (`--memory="256m"`).
  - Giới hạn CPU (`--cpus="0.5"`).
  - Giới hạn số lượng tiến trình con để chống lỗi fork bomb (`--pids-limit=20`).
- **Quyền hạn tối thiểu**: Mọi câu lệnh trong container đều được thực thi dưới tài khoản user không có quyền quản trị (`nobody` / `non-root user`).

---

## ⚙️ Cấu hình Môi trường (`.env`)

Tạo file `.env` ở thư mục gốc của `apps/worker` dựa trên file `.env.example`:

| Biến môi trường | Ý nghĩa | Giá trị mẫu |
| :--- | :--- | :--- |
| `APP_NATS_URL` | Chuỗi kết nối NATS Server để lấy Job nộp bài | `nats://127.0.0.1:4222` |
| `APP_BACKEND_GRPC_URL` | Địa chỉ và cổng gRPC của API Gateway NestJS để thông báo kết quả | `127.0.0.1:50051` |
| `APP_INTERNAL_AUTH_TOKEN` | Token xác thực nội bộ để gọi API của Gateway một cách an toàn | `secure_internal_token_for_communication` |
| `SANDBOX_MAX_CONCURRENT`| Giới hạn số lượng sandbox chạy song song tối đa (phụ thuộc năng lực máy chủ Worker) | `8` |

### 📝 Các cấu hình được Code cứng hoặc truyền Động:
- **Tên Stream & Subject**: Stream `"TRUESUBMIT"`, Subject `"submissions.created"` được code cứng nhất quán với NestJS.
- **Giới hạn chạy Sandbox (`Timeout`, `Memory`)**: Được lấy **động** theo từng đề bài từ database, sau đó NestJS gửi kèm trong payload của Job để Worker thiết lập trực tiếp khi khởi tạo container Docker.



