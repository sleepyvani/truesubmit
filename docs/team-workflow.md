# Quy Trình Làm Việc Nhóm (Team Development Workflow) <img src="https://images.weserv.nl/?url=https://api.iconify.design/solar/users-group-two-rounded-bold-duotone.svg?color=%25230070f3&output=png&w=48&h=48" width="48" height="48" align="center" />

Tài liệu này định nghĩa quy chuẩn làm việc bắt buộc dành cho mọi thành viên trong đội ngũ phát triển dự án **TrueSubmit**. Mục tiêu là tối ưu hóa hiệu suất làm việc bằng công nghệ hiện đại, giảm thiểu lỗi xung đột mã nguồn và nâng cao trình độ kỹ thuật của từng thành viên.

---

## <img src="https://images.weserv.nl/?url=https://api.iconify.design/solar/routing-bold-duotone.svg?color=%25230070f3&output=png&w=28&h=28" width="28" height="28" align="center" /> 1. Quy Tắc Sử Dụng Git & Chiến Lược Nhánh (Branching Strategy)
*Git là nền tảng quản lý mã nguồn của dự án. Mọi thay đổi phải tuân thủ nghiêm ngặt luồng công việc sau:*

* **Nguyên tắc vàng**: Tuyệt đối **KHÔNG** commit trực tiếp lên nhánh `main`. Nhánh `main` luôn là mã nguồn ổn định nhất đang hoặc sẵn sàng chạy trên production.
* **Tạo nhánh tính năng**: Mọi task phát triển chức năng mới hoặc sửa lỗi phải được thực hiện trên một nhánh con độc lập:
  * Tính năng mới: `feature/ten-tinh-nang` (Ví dụ: `feature/grpc-auth`)
  * Sửa lỗi: `bugfix/ten-loi` (Ví dụ: `bugfix/redis-connection-leak`)
* **Chính sách nhánh Thử nghiệm (Experimental Branch)**:
  * Khi triển khai các chức năng phức tạp hoặc **chưa chắc chắn** giải pháp có hoạt động tốt, hiệu quả, hay đúng ý mình hay không, **bắt buộc** phải tạo nhánh thử nghiệm với tiền tố `experimental/ten-tinh-nang`.
  * Triển khai code, chạy thử nghiệm cục bộ, đo đạc hiệu năng trên nhánh này. 
  * Nếu kết quả chạy tốt, ổn định và đáp ứng đầy đủ yêu cầu thiết kế, mới tiến hành tích hợp sang nhánh `feature` chính hoặc tạo Pull Request để merge vào `main`. Nếu không hiệu quả, xóa nhánh đó để giữ mã nguồn sạch sẽ.
* **Quy trình Merge**:
  * Chỉ được merge vào `main` sau khi toàn bộ bài test tự động (`go test` đối với Worker, Jest/Vitest đối với API) đều đạt kết quả `PASS` cục bộ.
  * Mọi Pull Request (PR) cần được tối thiểu 1 thành viên khác trong team review và phê duyệt (approved) trước khi merge.

---

## <img src="https://images.weserv.nl/?url=https://api.iconify.design/solar/cpu-bold-duotone.svg?color=%25230070f3&output=png&w=28&h=28" width="28" height="28" align="center" /> 2. Hướng Dẫn Phát Triển Đồng Hành Cùng AI (AI-Assisted Development)
*Dự án TrueSubmit coi AI (GitHub Copilot, Gemini, ChatGPT, Claude...) là trợ lý bắt buộc và không thể thiếu trong chu trình phát triển sản phẩm.*

* **Quy tắc 1: Bắt buộc truy vấn AI đối với mọi kiến thức chưa biết (Mandatory AI Querying)**
  * Tuyệt đối **không tự mò mẫm hoặc tìm kiếm thủ công** (qua Google, StackOverflow) khi gặp phải công nghệ, thư viện, hàm hoặc logic nghiệp vụ mới/chưa biết rõ bản chất.
  * **Hành động bắt buộc**: Phải sử dụng AI làm cổng truy vấn đầu tiên. Yêu cầu AI giải thích tường tận bản chất, cung cấp các use-case phổ biến, vẽ sơ đồ tư duy hoặc viết code ví dụ (POC). Chỉ khi AI không thể giải đáp thỏa đáng mới tìm kiếm qua các nguồn tài liệu khác.
* **Quy tắc 2: Tư duy phản biện nghiêm ngặt (Strict Critical Thinking)**
  * **Không tin cậy AI tuyệt đối**: Coi mọi dòng code AI viết ra đều có thể chứa bug tiềm ẩn, lỗ hổng bảo mật, hoặc lỗi logic ảo giác (hallucination).
  * **Hành động bắt buộc**: 
    1. Đọc và giải thích được chức năng của **từng dòng code** trước khi tích hợp vào dự án.
    2. Kiểm tra tính tồn tại của các hàm, thư viện, hoặc tham số cấu hình mà AI tự vẽ ra.
    3. Đánh giá độ phức tạp thuật toán (Time & Space Complexity) và đảm bảo code không làm block luồng xử lý chính (Event Loop của NestJS hoặc Goroutines của Go Worker).
* **Quy tắc 3: Tự động hóa kiểm thử mã nguồn AI (Automated Testing for AI Code)**
  * Bất kỳ hàm logic, xử lý dữ liệu phức tạp nào được sinh ra bởi AI **bắt buộc phải có Unit Test đi kèm** (được viết bởi chính lập trình viên hoặc yêu cầu AI sinh thêm test).
  * Phải chạy kiểm thử để bao phủ (coverage) ít nhất 80% các trường hợp biên (edge cases), tham số null/undefined, hoặc dữ liệu đầu vào sai định dạng.
* **Quy tắc 4: Tận dụng AI để tối ưu hóa cấu trúc (Refactoring & Code Review)**
  * Trước khi tạo Pull Request, lập trình viên **bắt buộc phải đưa mã nguồn của mình cho AI thực hiện code review trước**.
  * **Prompt gợi ý cho AI**: *"Hãy chỉ ra các lỗi bảo mật tiềm ẩn, lỗi leak bộ nhớ, hoặc các điểm chưa tối ưu trong đoạn code sau và đề xuất phương án viết lại sạch hơn (clean code)."*
  * Nghiên cứu kỹ các đề xuất tối ưu của AI, chọn lọc giải pháp tốt nhất để refactor lại code của mình.
* **Quy tắc 5: Học hỏi liên tục từ AI (Continuous Learning Loop)**
  * Không sử dụng AI như một máy sinh code tự động. Coi AI là một người hướng dẫn chuyên môn cao.
  * Khi AI đề xuất giải pháp tối ưu hơn tư duy thông thường, thành viên phải chủ động hỏi AI giải thích cặn kẽ nguyên lý (ví dụ: tại sao dùng mutex ở đây, tại sao dùng transaction ở kia). Biến tri thức của AI thành tri thức của bản thân.

---

## <img src="https://images.weserv.nl/?url=https://api.iconify.design/solar/shield-check-bold-duotone.svg?color=%25230070f3&output=png&w=28&h=28" width="28" height="28" align="center" /> 3. Quy Trình Kiểm Thử & Kiểm Soát Chất Lượng (Quality Assurance)
*Trước khi gửi code lên repository chung, mỗi lập trình viên phải tự kiểm thử sản phẩm của mình:*

1. **Kiểm thử cục bộ (Local Testing)**:
   * **Worker**: Chạy `go test -v ./...` trong thư mục `apps/worker` để xác nhận Docker Sandbox khởi chạy và chấm bài đúng.
   * **API Gateway & Web**: Chạy linting và build thử để đảm bảo TypeScript không có lỗi biên dịch.
2. **Kiểm thử liên thông (Integration Testing)**:
   * Chạy đầy đủ các thành phần (NextJS, NestJS, Go Worker, Redis, PostgreSQL).
   * Thực hiện nộp bài chạy thử trên giao diện Web để chắc chắn luồng dữ liệu thời gian thực (realtime) từ Sandbox về UI thông qua gRPC và SSE hoạt động mượt mà.
3. **Cập nhật tài liệu (Documentation Maintenance)**:
   * Nếu có sự thay đổi về cấu hình `.env`, cấu trúc bảng database (schema Drizzle), hoặc giao thức API/gRPC, bắt buộc phải cập nhật tài liệu tương ứng trong thư mục `docs/`.
