import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { trpc } from "@/lib/trpc";

export async function checkConfiguration(req: NextRequest): Promise<NextResponse | null> {
  const { pathname } = req.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return null;
  }

  try {
    const { isInitialized } = await trpc.configuration.status.query();

    if (isInitialized) {
      if (pathname.startsWith("/configuration")) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    } else {
      if (!pathname.startsWith("/configuration")) {
        return NextResponse.redirect(new URL("/configuration", req.url));
      }
    }
  } catch {
    if (!pathname.startsWith("/configuration")) {
      return NextResponse.redirect(new URL("/configuration", req.url));
    }
  }

  return null;
}