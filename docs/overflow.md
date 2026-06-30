# TrueSubmit - Tổng Quan Kiến Trúc Hệ Thống 🚀

TrueSubmit là hệ thống chấm bài trực tuyến (Online Judge) hiệu năng cao, được thiết kế để giải quyết bài toán **1000 sinh viên nộp bài đồng thời trong 1 giờ thi** với tốc độ biên dịch cực nhanh (sub-50ms) và phản hồi kết quả tức thời.

Để loại bỏ hoàn toàn sự phức tạp của việc định nghĩa URL truyền thống (REST API) và tăng tốc độ truyền tải dữ liệu, hệ thống sử dụng các công nghệ tiên tiến nhất năm 2026: **tRPC**, **gRPC**, **Redis Queue**, và **Server-Sent Events (SSE)**.

---

## 🏗️ Sơ đồ Kiến trúc & Luồng Dữ liệu (Workflow)

```mermaid
sequenceDiagram
    autonumber
    actor SinhVien as Sinh viên
    participant Web as Next.js Web (Frontend)
    participant API as NestJS API (Gateway)
    participant Redis as Redis Queue
    participant Worker as Golang Worker (Chấm bài)
    participant Sandbox as Docker Sandbox (RAMDisk)
    database DB as PostgreSQL (Drizzle)

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
* **Mục đích**: Thay thế hoàn toàn REST API truyền thống giữa ứng dụng client Next.js và máy chủ NestJS.
* **Cách thức**: Định nghĩa các Procedures ở Backend và chia sẻ Types sang Frontend. Frontend gọi hàm API như một hàm local (`trpc.submission.submit.useMutation()`), loại bỏ hoàn toàn việc viết URL thủ công hay xử lý JSON parsing.

### 2. Redis Queue (Giảm chấn tải cao)
* **Mục đích**: Điều phối và làm đệm lưu trữ bài nộp khi có hàng nghìn sinh viên nhấn nút nộp bài cùng lúc.
* **Cách thức**: Sử dụng cấu trúc danh sách Redis (`LPUSH` / `BRPOP`). NestJS chỉ đẩy thông tin bài nộp vào Redis và phản hồi ngay lập tức cho client. Golang Worker tự động rút bài nộp ra chấm khi rảnh. Bảo vệ hệ thống khỏi việc bị treo do quá tải CPU biên dịch.

### 3. gRPC (Giao tiếp Worker $\rightarrow$ Backend)
* **Mục đích**: Chuyển kết quả chấm bài từ Worker Golang về NestJS API nhanh chóng, bảo mật.
* **Cách thức**: Sử dụng giao thức nhị phân HTTP/2 thông qua Protocol Buffers. Không cần khai báo URL, truyền tải dữ liệu cực kỳ nhỏ gọn dưới dạng binary.
* **Bảo mật**: Các gRPC requests từ Worker phải đính kèm mã khóa bí mật `APP_INTERNAL_AUTH_TOKEN` trong gRPC Metadata để ngăn ngừa sinh viên scan cổng và làm giả kết quả chấm.

### 4. Server-Sent Events - SSE (Real-time Stream đẩy điểm)
* **Mục đích**: Đẩy trạng thái chấm bài (`PENDING` $\rightarrow$ `COMPILING` $\rightarrow$ `RUNNING` $\rightarrow$ `ACCEPTED`) về giao diện sinh viên theo thời gian thực mà không cần Polling liên tục.
* **Cách thức**: Kết nối HTTP luồng một chiều (One-way Stream). Trình duyệt sử dụng đối tượng `EventSource` nguyên bản để lắng nghe. SSE nhẹ hơn rất nhiều so với WebSockets vì không cần duy trì kết nối hai chiều.

---

## 🔒 Cơ chế Sandbox của Worker
Để bảo đảm mã nguồn không an sau của sinh viên không gây ảnh hưởng đến máy chủ vật lý:
1. **Docker Container Isolation**: Chạy mỗi bài biên dịch bên trong một container Docker được cấu hình `--network none` (hoàn toàn ngắt kết nối Internet).
2. **Warm Pool (Tối ưu <50ms)**: Worker giữ sẵn các container biên dịch (GCC, Python, Go) ở chế độ ngủ (Idle), sao chép code vào chạy trực tiếp và dọn dẹp sạch sẽ sau khi dùng xong, thay vì khởi tạo container mới từ đầu.
3. **RAMDisk (Tmpfs Mount)**: Mount thư mục làm việc của Container trực tiếp trên bộ nhớ RAM vật lý để loại bỏ nghẽn I/O ổ cứng.
4. **Cgroups Limits**: Áp đặt cứng giới hạn RAM (`256MB`), CPU (`0.5 Cores`) và PIDs limit (`20` - chống Fork Bomb).
