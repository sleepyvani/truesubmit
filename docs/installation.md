# Hướng Dẫn Cài Đặt Môi Trường Cục Bộ trên Windows <img src="https://images.weserv.nl/?url=https://api.iconify.design/solar/settings-bold-duotone.svg?color=%25230070f3&output=png&w=48&h=48" width="48" height="48" align="center" />

### **Hạ tầng & Hệ thống (System Tech Stack)**
<p align="left">
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=nextjs,nestjs,go,docker,postgres,redis,ts,tailwind,pnpm,nodejs" />
  </a>
</p>

---

Tài liệu này hướng dẫn chi tiết cách thiết lập dự án **TrueSubmit** dành riêng cho hệ điều hành **Windows**. Bạn và đội ngũ có thể lựa chọn 1 trong 2 phương án cài đặt dưới đây tùy thuộc vào thói quen phát triển.

---

## <img src="https://images.weserv.nl/?url=https://api.iconify.design/solar/structure-bold-duotone.svg?color=%25230070f3&output=png&w=28&h=28" width="28" height="28" align="center" /> PHƯƠNG ÁN 1: Cài đặt Native cục bộ (Local không qua Docker)
*Phương án này chạy trực tiếp NodeJS, PostgreSQL, NATS, Go trên Windows để tối ưu tốc độ phản hồi khi code. Docker chỉ được cài đặt để làm môi trường Sandbox cho Worker chấm bài.*

### <img src="https://images.weserv.nl/?url=https://api.iconify.design/solar/settings-bold-duotone.svg?color=%25230070f3&output=png&w=20&h=20" width="20" height="20" align="center" /> Bước 1: Cài đặt các công cụ tiền đề trực tiếp trên Windows
1. **Node.js**: Tải và chạy bộ cài đặt `.msi` phiên bản LTS (khuyến nghị **v20.x** trở lên) từ [nodejs.org](https://nodejs.org/).
2. **pnpm**: Sau khi cài NodeJS, mở cmd/PowerShell và chạy lệnh để cài pnpm:
   ```powershell
   npm install -g pnpm
   ```
3. **Golang**: Tải bộ cài `.msi` (phiên bản **v1.22** trở lên) từ [go.dev/dl](https://go.dev/dl/) và cài đặt.
4. **PostgreSQL**: 
   * Tải bản installer cho Windows từ [EnterpriseDB](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads).
   * Trong lúc cài đặt, đặt mật khẩu là `password` cho user `postgres` và giữ nguyên cổng mặc định `5432`.
5. **NATS Server cho Windows**: 
   * Tải bản phát hành (release) của NATS Server dành cho Windows từ [nats.io](https://nats.io/download/) hoặc trực tiếp từ GitHub Releases của `nats-io/nats-server`.
   * Chạy file thực thi `nats-server.exe` với cấu hình bật JetStream: `nats-server -js`.
   * Đảm bảo dịch vụ NATS chạy ở cổng mặc định `4222`.
6. **Docker Desktop**: Tải và cài đặt từ [Docker Desktop](https://www.docker.com/products/docker-desktop/).
   * Docker Desktop bắt buộc phải cài đặt trên Windows để Go Worker có thể khởi tạo các container sandbox (chạy độc lập, không cấu hình cổng mạng để chứa code chấm).
   * Đảm bảo tính năng **WSL 2 backend** được bật trong cài đặt Docker Desktop.

### <img src="https://images.weserv.nl/?url=https://api.iconify.design/solar/tuning-bold-duotone.svg?color=%25230070f3&output=png&w=20&h=20" width="20" height="20" align="center" /> Bước 2: Thiết lập Biến môi trường (`.env`)
1. **API Gateway (`apps/api`)**:
   Tạo file `apps/api/.env` từ file `.env.example` và cấu hình:
   ```env
   APP_DATABASE_URI_VALUE=postgresql://postgres:password@localhost:5432/truesubmit?schema=public
   APP_NATS_URL=nats://127.0.0.1:4222
   APP_INTERNAL_AUTH_TOKEN=secure_internal_token_for_communication
   ```
2. **Go Worker (`apps/worker`)**:
   Tạo file `apps/worker/.env` từ file `.env.example` và cấu hình:
   ```env
   APP_NATS_URL=nats://127.0.0.1:4222
   APP_BACKEND_GRPC_URL=127.0.0.1:50051
   APP_INTERNAL_AUTH_TOKEN=secure_internal_token_for_communication
   SANDBOX_MAX_CONCURRENT=8
   ```

### <img src="https://images.weserv.nl/?url=https://api.iconify.design/solar/rocket-bold-duotone.svg?color=%25230070f3&output=png&w=20&h=20" width="20" height="20" align="center" /> Bước 3: Khởi chạy dự án
Mở 3 cửa sổ terminal riêng biệt (PowerShell/cmd):
* **Terminal 1: Cài đặt & Di chuyển cơ sở dữ liệu**
  ```powershell
  pnpm install
  cd apps/api
  npx drizzle-kit push
  pnpm run dev
  ```
  *(API Gateway sẽ khởi chạy tại cổng 3001, cổng gRPC chạy tại 50051)*
* **Terminal 2: Chạy Frontend Web**
  ```powershell
  cd apps/frontend
  pnpm run dev
  ```
  *(Truy cập giao diện tại http://localhost:3000)*
* **Terminal 3: Chạy Worker Chấm Bài**
  ```powershell
  cd apps/worker
  go run main.go
  ```

---

## <img src="https://images.weserv.nl/?url=https://api.iconify.design/solar/box-bold-duotone.svg?color=%25230070f3&output=png&w=28&h=28" width="28" height="28" align="center" /> PHƯƠNG ÁN 2: Sử dụng Docker Compose (All-in-One cho DB/NATS)
*Phương án này giúp bạn không cần cài đặt thủ công PostgreSQL và NATS trực tiếp trên máy Windows, mọi thứ được đóng gói qua Docker.*

### <img src="https://images.weserv.nl/?url=https://api.iconify.design/solar/settings-bold-duotone.svg?color=%25230070f3&output=png&w=20&h=20" width="20" height="20" align="center" /> Bước 1: Cài đặt công cụ
Bạn chỉ cần cài đặt **NodeJS**, **pnpm**, **Go SDK** và **Docker Desktop** trên Windows.

### <img src="https://images.weserv.nl/?url=https://api.iconify.design/solar/tuning-bold-duotone.svg?color=%25230070f3&output=png&w=20&h=20" width="20" height="20" align="center" /> Bước 2: Khởi động DB và NATS bằng Docker
Tại thư mục gốc của dự án (`truesubmit/`), nơi có file `docker-compose.yml`, mở PowerShell và chạy:
```powershell
docker compose up -d
```
Lệnh này sẽ tự động tải và khởi chạy PostgreSQL cùng NATS trong nền. Bạn có thể kiểm tra trạng thái bằng lệnh `docker compose ps`.

### <img src="https://images.weserv.nl/?url=https://api.iconify.design/solar/rocket-bold-duotone.svg?color=%25230070f3&output=png&w=20&h=20" width="20" height="20" align="center" /> Bước 3: Thiết lập & Chạy ứng dụng
1. Copy cấu hình `.env` cho `apps/api` và `apps/worker` y hệt như Phương án 1 (do cổng DB/NATS của container được map trực tiếp ra `localhost`).
2. Thực hiện cài đặt dependencies và chạy các dự án:
   * **Terminal 1 (Backend)**: `cd apps/api && pnpm install && npx drizzle-kit push && pnpm run dev`
   * **Terminal 2 (Frontend)**: `cd apps/frontend && pnpm run dev`
   * **Terminal 3 (Worker)**: `cd apps/worker && go run main.go`

---

## <img src="https://images.weserv.nl/?url=https://api.iconify.design/solar/cpu-bold-duotone.svg?color=%25230070f3&output=png&w=28&h=28" width="28" height="28" align="center" /> 3. Chuẩn bị Docker Images cho Sandbox (Bắt buộc cho cả 2 phương án)
Để tránh việc Worker bị quá thời gian chạy (TLE) ở lần nộp bài đầu tiên do phải tải Docker Image của các ngôn ngữ, hãy chạy các lệnh sau trong terminal để kéo sẵn các image về máy Windows:
```powershell
docker pull gcc:latest
docker pull python:latest
docker pull golang:latest
docker pull openjdk:latest
docker pull mcr.microsoft.com/dotnet/sdk:latest
docker pull ziglang/zig:latest
```

---

## <img src="https://images.weserv.nl/?url=https://api.iconify.design/solar/shield-check-bold-duotone.svg?color=%25230070f3&output=png&w=28&h=28" width="28" height="28" align="center" /> 4. Kiểm tra Môi trường (Verification)
Để chắc chắn Docker Sandbox trên máy Windows của bạn kết nối và hoạt động chính xác:
1. Mở PowerShell trong thư mục `apps/worker` và chạy kiểm thử tự động:
   ```powershell
   go test -v ./...
   ```
2. Nếu xuất hiện chữ `PASS` cho các bài test C++ và Python, nghĩa là hệ thống Docker Sandbox đã sẵn sàng hoạt động.
