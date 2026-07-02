import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { trpc } from "@/lib/trpc";

export async function checkConfiguration(req: NextRequest): Promise<NextResponse | null> {
  const { pathname } = req.nextUrl;

  // Bỏ qua kiểm tra các file tĩnh, tài nguyên, API nội bộ
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return null;
  }

  try {
    // Gọi API thông qua tRPC client đã được định nghĩa kiểu đầy đủ
    const { isInitialized } = await trpc.configuration.status.query();

    if (isInitialized) {
      // Nếu đã cấu hình mà cố tình vào trang configuration, chuyển về trang chủ /
      if (pathname === "/configuration") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    } else {
      // Nếu chưa cấu hình, bắt buộc chuyển hướng về trang cấu hình /configuration
      if (pathname !== "/configuration") {
        return NextResponse.redirect(new URL("/configuration", req.url));
      }
    }
  } catch (error) {
    console.error("[Configuration Proxy Error]: Failed to check backend status via tRPC.", error);
    
    // Nếu lỗi kết nối backend hoặc lỗi Database, coi như hệ thống chưa khởi tạo hoàn tất
    // và bắt buộc chuyển hướng về /configuration để cài đặt/sửa đổi kết nối
    if (pathname !== "/configuration") {
      return NextResponse.redirect(new URL("/configuration", req.url));
    }
  }

  return null;
}

