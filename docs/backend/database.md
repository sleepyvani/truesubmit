# Database Schema Files Documentation (`docs/api/database.md`) 🗄️

Tài liệu này định nghĩa cấu trúc phân chia các file schema trong **Drizzle ORM** (thư mục `apps/api/src/database/schemas/`) và các bảng tương ứng chứa bên trong hệ thống **TrueSubmit** phiên bản Production đầy đủ:

---

### Nguyên tắc thiết kế cốt lõi
* **Khóa chính UUIDv7**: Toàn bộ các bảng sử dụng UUID làm khóa chính đều được cấu hình sinh tự động dạng **UUIDv7** ở tầng Application (thông qua thư viện `uuidv7` và Drizzle `$defaultFn(() => uuidv7())`). Việc này giúp đảm bảo tính tuần tự tăng dần theo thời gian (time-ordered), tránh hiện tượng **Page Split** trên chỉ mục B-Tree của PostgreSQL, giảm phân mảnh đĩa và tăng hiệu năng ghi khi chịu tải lớn.
* **Mảng quyền hạn trực tiếp**: Thay vì phân rã thành nhiều bảng liên kết phức tạp (`role_permissions`), quyền hạn (`permissions`) được lưu trữ trực tiếp dưới dạng một mảng chuỗi (`text[]` của PostgreSQL) ngay tại cột `permissions` của bảng `roles`.
* **Hằng số dùng chung**: Các vai trò (`KeyRole`) và quyền hạn (`KeyPermission`) được quản lý tập trung tại package chung `@repo/constants` để dùng chung cho cả Frontend (`apps/web`) và Backend (`apps/api`).

---
 
### 1. File `users.schema.ts` (Quản lý Người dùng, Vai trò & Phân quyền)
* **Bảng `users`**: Thông tin tài khoản chính (email, mật khẩu băm, trạng thái tài khoản) liên kết trực tiếp tới mã vai trò `role_id`.
* **Bảng `user_profiles`**: Hồ sơ chi tiết (Họ tên hiển thị, ảnh đại diện, tổ chức/trường học/công ty, mã số sinh viên, lớp học).
* **Bảng `roles`**: Lưu danh sách các vai trò (như Admin, Creator, User, Guest) định danh duy nhất bằng `keyRole` (sử dụng enum `KeyRole` từ `@repo/constants`) và chứa mảng quyền hạn `permissions` kiểu `text[]` (sử dụng các hằng số của enum `KeyPermission`).
* **Bảng `groups`**: Quản lý các nhóm học tập hoặc các lớp học hành chính.
* **Bảng `group_members`**: Liên kết người dùng vào các nhóm tương ứng (sinh viên tham gia lớp học).
* **Bảng `refresh_tokens`**: Quản lý các phiên đăng nhập, hỗ trợ chặn hoặc thu hồi quyền truy cập.

### 2. File `problems.schema.ts` (Quản lý Đề bài & Tài nguyên)
* **Bảng `problems`**: Thông tin đề bài (tiêu đề, mô tả Markdown, độ khó, điểm số mặc định, trạng thái Public/Private, giới hạn chạy của Sandbox như thời gian, RAM, CPU).
* **Bảng `testcases`**: Dữ liệu input/output mẫu (public) và bộ test ẩn (private) dùng để chấm điểm.
* **Bảng `code_templates`**: Mã nguồn khung/mẫu ban đầu hiển thị sẵn trên Monaco Editor cho từng ngôn ngữ khi người dùng làm bài.
* **Bảng `tags`**: Thể loại đề bài (ví dụ: Quy hoạch động, Đồ thị, Cây nhị phân...).
* **Bảng `problem_tags`**: Bảng trung gian liên kết tag và đề bài.
* **Bảng `problem_editorials`**: Lời giải mẫu, thuật toán gợi ý do người ra đề soạn thảo.

### 3. File `contests.schema.ts` (Quản lý Kỳ thi & Giám sát Chống gian lận)
* **Bảng `contests`**: Chi tiết kỳ thi/cuộc thi (tên, mô tả, thời gian bắt đầu, kết thúc, mật khẩu phòng thi, trạng thái tự do hay giới hạn nhóm thi cụ thể).
* **Bảng `contest_problems`**: Danh sách đề bài trong kỳ thi (ánh xạ ký hiệu bài A, B, C... và trọng số điểm).
* **Bảng `contest_participants`**: Danh sách thí sinh đăng ký tham gia thi, ghi nhận IP đăng ký/đăng nhập lúc thi để chống gian lận.
* **Bảng `contest_announcements`**: Các thông báo/đính chính đề bài của ban tổ chức trong thời gian thi (broadcast realtime qua SSE).

### 4. File `submissions.schema.ts` (Quản lý Bài nộp, Chấm thi & Quét Đạo văn)
* **Bảng `submissions`**: Thông tin bài nộp (mã nguồn, ngôn ngữ, trạng thái PENDING/COMPILING/RUNNING/ACCEPTED, tổng điểm đạt được).
* **Bảng `submission_results`**: Trạng thái chi tiết của từng testcase trong bài nộp (AC/WA/TLE/MLE, thời gian chạy thực tế, RAM tiêu thụ thực tế).
* **Bảng `submission_drafts`**: Tự động lưu nháp mã nguồn của thí sinh khi đang làm bài.
* **Bảng `plagiarism_reports`**: Kết quả quét đạo văn của kỳ thi (so sánh độ tương đồng mã nguồn giữa các cặp bài nộp). *Được khai báo tại đây để tránh vòng lặp phụ thuộc (circular imports) với contest.*

### 5. File `cms.schema.ts` (Hệ thống Quản trị Nội dung - CMS & Media)
* **Bảng `cms_pages`**: Các trang nội dung tĩnh (Ví dụ: Trang điều khoản, hướng dẫn sử dụng).
* **Bảng `menus`**: Cấu hình danh mục điều hướng động trên giao diện (Header, Footer, Sidebar) lưu dưới dạng JSONB.
* **Bảng `gallery`**: Thư viện phương tiện (Lưu trữ ảnh, tệp đính kèm do giáo viên upload để nhúng vào đề bài).

### 6. File `notifications.schema.ts` (Quản lý Thông báo người dùng)
* **Bảng `notifications`**: Lưu các thông tin thông báo (hệ thống, cuộc thi, kết quả chấm bài).
* **Bảng `user_notifications`**: Theo dõi trạng thái đọc/chưa đọc thông báo của từng người dùng.

### 7. File `security.schema.ts` (Chặn Truy cập & An ninh Hệ thống)
* **Bảng `access_denies`**: Danh sách đen (Blacklist) chặn truy cập (IP spam, email rác, hoặc cấm user tham gia thi).

### 8. File `extensions.schema.ts` (Cấu hình Tích hợp bên ngoài)
* **Bảng `extensions`**: Quản lý danh sách dịch vụ tích hợp bên ngoài (LDAP, S3, Discord Webhooks, MOSS).
* **Bảng `extension_configs`**: Lưu cấu hình động của từng extension dưới dạng JSON.

### 9. File `monitoring.schema.ts` (Giám sát Hệ thống Chấm bài)
* **Bảng `worker_nodes`**: Đăng ký và giám sát sức khỏe của các Go Worker đang hoạt động (CPU/RAM/Docker stats).
* **Bảng `activity_logs`**: Nhật ký hoạt động chi tiết hệ thống để kiểm toán.

### 10. File `settings.schema.ts` (Cấu hình Hệ thống)
* **Bảng `system_settings`**: Cấu hình toàn cục động (Bảo trì hệ thống, danh sách ngôn ngữ được nộp bài).

### 11. File `relations.ts` (Định nghĩa Mối quan hệ)
* **Mục đích**: Định nghĩa tập trung tất cả các mối quan hệ (One-to-One, One-to-Many, Many-to-Many) giữa các thực thể mà không chứa bất kỳ dòng chú thích phân vùng nào. Việc tách biệt quan hệ ra file riêng giúp ngăn ngừa triệt để lỗi vòng lặp phụ thuộc (Circular Import Dependency) trong TypeScript.
