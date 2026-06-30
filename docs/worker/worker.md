# Execution Engine Worker Documentation (`apps/worker`) ⚙️

Ứng dụng **Worker** là thành phần cốt lõi chịu trách nhiệm chấm bài của hệ thống **TrueSubmit**. Được phát triển hoàn toàn bằng ngôn ngữ **Golang**, Worker tận dụng tối đa khả năng xử lý song song (concurrency) vượt trội và hiệu năng cao để biên dịch, thực thi mã nguồn trong môi trường Sandbox an toàn.

---

## 🛠️ Tech Stack & Thư viện sử dụng
- **Language**: Golang (phiên bản 1.25 trở lên)
- **Container SDK**: Official Docker Go SDK (`github.com/docker/docker/client`)
- **Queue Client**: Go-redis (`github.com/redis/go-redis/v9`)
- **gRPC Library**: Google gRPC Client (`google.golang.org/grpc`) để báo cáo kết quả chấm bài trực tiếp về NestJS.

---

## 🏗️ Kiến trúc & Luồng xử lý của Worker

```text
apps/worker/
├── internal/
│   ├── pb/              # Các file sinh ra từ protobuf (submission.pb.go, submission_grpc.pb.go)
│   ├── queue/           # Quản lý kết nối và lắng nghe Redis Queue
│   └── sandbox/         # Quản lý Docker SDK (tạo, cấu hình, thực thi container)
├── main.go              # Điểm khởi chạy (Khởi tạo Pool Worker, kết nối Redis & gRPC)
└── go.mod               # Khai báo dependency của Golang
```

### Luồng xử lý chi tiết của 1 Job chấm bài:
1. **Lắng nghe**: Worker sử dụng lệnh chặn `BRPOP` trên hàng đợi `truesubmit_queue` của Redis để lấy thông tin bài nộp ngay khi API Gateway đẩy vào.
2. **Khởi tạo Sandbox**: Worker yêu cầu Docker SDK tạo một container dựa trên Docker Image của ngôn ngữ tương ứng (ví dụ: `gcc:latest` cho C/C++, `python:latest` cho Python, `ziglang/zig:latest` cho Zig).
3. **Ghi code**: Ghi mã nguồn và tệp input đầu vào nhận từ payload của Job vào thư mục tạm của máy chủ, sau đó chèn vào thư mục `/workspace` được mount dạng RAMDisk (`tmpfs`) bên trong container.
4. **Biên dịch & Thực thi (Compile & Run)**:
   - Chạy lệnh biên dịch (nếu ngôn ngữ cần biên dịch, ví dụ: `g++ -O3 main.cpp -o main`).
   - Chạy file thực thi hoặc thông dịch mã nguồn kèm theo chuyển hướng đầu vào (`stdin`) từ file `input.txt`.
   - Giám sát thời gian chạy (Time Limit) và bộ nhớ tiêu thụ tối đa (Memory Limit).
5. **So sánh (Judge)**: Đọc đầu ra chuẩn (`stdout`) của code sinh viên và so sánh từng byte với kết quả kỳ vọng (`expected output`).
6. **Trả kết quả**: Gọi RPC `ReportResult` của `SubmissionService` đến API Gateway qua kết nối gRPC, gửi kết quả chấm chi tiết (`AC`/`WA`/`TLE`/`MLE`/`RE`/`CE`, thời gian chạy) kèm theo `token` xác thực nội bộ. API Gateway NestJS sẽ chịu trách nhiệm ghi DB và thông báo realtime cho client qua SSE.

---

## ⚡ Tối ưu hiệu năng cho kịch bản Tải cao (1000 Sinh viên)

Để đạt tốc độ compile và trả phản hồi cực nhanh khi có hàng ngàn bài nộp đồng thời:

### 1. Kỹ thuật Bể chứa Container sẵn sàng (Warm Container Pooling)
- **Vấn đề**: Việc chạy lệnh `docker run` thông thường mất từ **1 đến 2 giây** vì Docker phải tạo mới container từ đầu, khởi tạo namespace, cgroup và mạng. Điều này làm hệ thống bị nghẽn nghiêm trọng khi có hàng trăm sinh viên nộp bài cùng lúc.
- **Giải pháp**: Worker duy trì một **Pool các Container chạy sẵn ở chế độ chờ (Idle Warm Containers)**. Khi có bài nộp:
  1. Worker lấy một container trống từ Pool.
  2. Copy file code vào container thông qua cơ chế chèn file của Docker SDK.
  3. Thực thi lệnh biên dịch/chạy và đọc stdout trực tiếp.
  4. Sau khi chạy xong, xóa file code và dọn dẹp tiến trình rác trong container thay vì hủy container. Trả container trở lại Pool.
  5. *Kết quả*: Thời gian khởi chạy giảm xuống chỉ còn **dưới 50ms**.

### 2. Sử dụng Bộ nhớ RAM ảo (Tmpfs Mount)
- **Giải pháp**: Cấu hình Docker để mount thư mục làm việc của sinh viên trong container dưới dạng `tmpfs` (RAMDisk).
- **Lợi ích**: Toàn bộ quá trình ghi mã nguồn, biên dịch ra file thực thi và ghi file đầu ra tạm thời đều diễn ra hoàn toàn trên bộ nhớ RAM thay vì ghi xuống ổ cứng SSD/HDD vật lý. Điều này loại bỏ hoàn toàn nút thắt cổ chai về tốc độ đọc ghi đĩa (I/O Bottleneck).

### 3. Điều phối luồng xử lý (Concurrency Control bằng Go Goroutine)
- Worker triển khai cấu trúc **Worker Pool Pattern** trong Go. Chỉ cho phép tối đa một số lượng Goroutine nhất định chạy song song (ví dụ: tương đương số luồng CPU vật lý của server nhân với hệ số tối ưu).
- Điều này đảm bảo CPU của máy chủ không bị quá tải dẫn đến tình trạng treo máy khi 1000 bài nộp đổ về cùng một lúc. Các bài nộp vượt quá khả năng xử lý tức thời sẽ nằm chờ an toàn trong hàng đợi Redis với thời gian trễ tối thiểu.

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
| `APP_REDIS_CONN_STRING` | Chuỗi kết nối Redis để lấy Job nộp bài (giao thức `redis://`) | `redis://127.0.0.1:6379` |
| `APP_BACKEND_GRPC_URL` | Địa chỉ và cổng gRPC của API Gateway NestJS để thông báo kết quả | `127.0.0.1:50051` |
| `APP_INTERNAL_AUTH_TOKEN` | Token xác thực nội bộ để gọi API của Gateway một cách an toàn | `secure_internal_token_for_communication` |
| `SANDBOX_MAX_CONCURRENT`| Giới hạn số lượng sandbox chạy song song tối đa (phụ thuộc năng lực máy chủ Worker) | `8` |

### 📝 Các cấu hình được Code cứng hoặc truyền Động:
- **Tên hàng đợi (`SUBMISSION_QUEUE_NAME`)**: Code cứng trực tiếp chuỗi `"truesubmit_queue"` để đồng bộ hóa với NestJS.
- **Giới hạn chạy Sandbox (`Timeout`, `Memory`)**: Được lấy **động** theo từng đề bài từ database, sau đó NestJS gửi kèm trong payload của Job để Worker thiết lập trực tiếp khi khởi tạo container Docker.



