# Database Schema Files Documentation (`docs/api/database.md`) 🗄️

Tài liệu này định nghĩa cấu trúc phân chia các file schema trong **Drizzle ORM** (thư mục `apps/api/src/database/schema/`) và các bảng tương ứng chứa bên trong hệ thống **TrueSubmit** phiên bản Production đầy đủ:

---
 
### 1. File `users.schema.ts` (Quản lý Người dùng, Vai trò & Phân quyền)
* **Bảng `users`**: Thông tin tài khoản chính (email, mật khẩu băm, trạng thái tài khoản) liên kết trực tiếp tới mã vai trò `role_id`.
* **Bảng `user_profiles`**: Hồ sơ chi tiết (Họ tên hiển thị, ảnh đại diện, tổ chức/trường học/công ty, và các thông tin tùy chọn khác như mã số sinh viên, lớp học).
* **Bảng `roles`**: Lưu danh sách các vai trò trong hệ thống (như Admin, Creator, User, Guest) được định danh duy nhất bằng một **Key Role** (ví dụ: `system_admin`, `contest_creator`, `regular_user`).
* **Bảng `permissions`**: Danh sách các quyền chi tiết (ví dụ: `problem:create`, `contest:moderate`, `submission:judge`).
* **Bảng `role_permissions`**: Bảng trung gian liên kết các quyền hạn (`permissions`) vào từng vai trò (`roles`).
* **Bảng `groups`**: Quản lý các nhóm học tập, nhóm thi hoặc các lớp học hành chính.
* **Bảng `group_members`**: Bảng liên kết người dùng vào các nhóm tương ứng.
* **Bảng `refresh_tokens`**: Quản lý các phiên đăng nhập, hỗ trợ chặn đăng nhập đồng thời trên nhiều thiết bị.

### 2. File `problems.schema.ts` (Quản lý Đề bài & Tài nguyên)
* **Bảng `problems`**: Thông tin đề bài (tiêu đề, mô tả chi tiết bằng Markdown, độ khó, điểm số mặc định, trạng thái Public/Private, giới hạn chạy của Sandbox).
* **Bảng `testcases`**: Dữ liệu input/output mẫu (public) và bộ test ẩn (private) dùng để chấm điểm.
* **Bảng `code_templates`**: Mã nguồn khung/mẫu ban đầu (Boilerplate) hiển thị sẵn trên Monaco Editor cho từng ngôn ngữ khi người dùng nhấn vào làm bài.
* **Bảng `tags`**: Thể loại đề bài (ví dụ: Quy hoạch động, Đồ thị, Cây nhị phân...).
* **Bảng `problem_tags`**: Bảng trung gian liên kết tag và đề bài.
* **Bảng `problem_editorials`**: Lời giải mẫu, thuật toán gợi ý do người ra đề soạn thảo (chỉ mở ra sau khi kỳ thi kết thúc).

### 3. File `contests.schema.ts` (Quản lý Kỳ thi & Giám sát Chống gian lận)
* **Bảng `contests`**: Chi tiết kỳ thi/cuộc thi (tên, mô tả, thời gian bắt đầu, thời gian kết thúc, mật khẩu phòng thi nếu có, trạng thái tự do đăng ký hay chỉ cho phép các nhóm cụ thể tham gia).
* **Bảng `contest_problems`**: Danh sách đề bài trong kỳ thi (ánh xạ ký hiệu bài A, B, C... và trọng số điểm).
* **Bảng `contest_participants`**: Danh sách thí sinh đăng ký/được phép tham gia thi, ghi nhận IP đăng nhập lúc thi của từng người.
* **Bảng `contest_announcements`**: Các thông báo/đính chính đề bài của ban tổ chức trong thời gian thi (tự động broadcast realtime qua SSE đến toàn bộ thí sinh).
* **Bảng `plagiarism_reports`**: Kết quả quét đạo văn (sử dụng thuật toán so khớp mã nguồn như MOSS để so sánh độ tương đồng code giữa các bài nộp sau khi cuộc thi kết thúc).

### 4. File `submissions.schema.ts` (Quản lý Bài nộp & Nhật ký làm bài)
* **Bảng `submissions`**: Thông tin bài nộp (mã nguồn, ngôn ngữ, thời gian nộp, tổng điểm đạt được).
* **Bảng `submission_results`**: Trạng thái chi tiết của từng testcase trong bài nộp (AC/WA/TLE/MLE, thời gian chạy thực tế, RAM tiêu thụ thực tế).
* **Bảng `submission_drafts`**: **Lưu nháp tự động** mã nguồn của người dùng cứ sau mỗi 30 giây khi đang làm bài.

### 5. File `cms.schema.ts` (Hệ thống Quản trị Nội dung - CMS & Media) *(Mới)*
* **Bảng `cms_pages`**: Các trang nội dung tĩnh/động do quản trị biên soạn (Ví dụ: Trang điều khoản sử dụng, hướng dẫn sử dụng, giới hạn hệ thống, trang giới thiệu).
* **Bảng `menus`**: Cấu hình danh mục điều hướng (quản lý liên kết động và vị trí hiển thị của menu trên Header, Footer, Sidebar).
* **Bảng `gallery`**: Thư viện phương tiện (Lưu trữ thông tin ảnh, tệp đính kèm do người ra đề upload để nhúng vào đề bài hoặc lời giải).

### 6. File `notifications.schema.ts` (Quản lý Thông báo người dùng) *(Mới)*
* **Bảng `notifications`**: Lưu các thông tin thông báo (thông báo hệ thống, thông báo bắt đầu kỳ thi, thông báo kết quả chấm bài).
* **Bảng `user_notifications`**: Bảng theo dõi trạng thái đọc/chưa đọc thông báo của từng người dùng cụ thể.

### 7. File `security.schema.ts` (Chặn Truy cập & An ninh Hệ thống) *(Mới)*
* **Bảng `access_denies`**: Danh sách đen (Blacklist) chặn truy cập (chặn các địa chỉ IP spam request, chặn email đăng ký rác, hoặc thiết lập danh sách IP bị cấm tham dự phòng thi).

### 8. File `extensions.schema.ts` (Cấu hình Tích hợp bên ngoài)
* **Bảng `extensions`**: Quản lý danh sách các dịch vụ tích hợp mở rộng bên ngoài (LDAP/Active Directory, S3/MinIO Storage, Discord/Slack Webhooks, MOSS).
* **Bảng `extension_configs`**: Lưu cấu hình động của từng extension dưới dạng JSON.

### 9. File `monitoring.schema.ts` (Giám sát Hệ thống Chấm bài)
* **Bảng `worker_nodes`**: Đăng ký và giám sát các Go Worker đang hoạt động (Địa chỉ IP, tình trạng Healthcheck, số sandbox đang chạy đồng thời).
* **Bảng `activity_logs`**: Nhật ký hoạt động (lịch sử đăng nhập, thay đổi cấu hình, thay đổi quyền hạn).

### 10. File `settings.schema.ts` (Cấu hình Hệ thống)
* **Bảng `system_settings`**: Quản lý cấu hình toàn cục (Giới hạn sandbox mặc định, danh sách các đuôi file ngôn ngữ được phép nộp, cấu hình bật/tắt toàn bộ server).

### 11. File `relations.ts` (Định nghĩa Mối quan hệ)
* **Mục đích**: Định nghĩa tập trung tất cả các mối quan hệ (One-to-One, One-to-Many, Many-to-Many) giữa các thực thể (như `users` và `roles`, `contests` và `problems`, `submissions` và `submission_results`). Việc tách biệt quan hệ ra file riêng giúp ngăn ngừa triệt để lỗi vòng lặp phụ thuộc (Circular Import Dependency) trong TypeScript.
