import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {

  const { pathname } = req.nextUrl;

  // 🔥 NO bloquear archivos internos
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const user = req.cookies.get("user");

  if (!user && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/admin")) {
    const role = req.cookies.get("role")?.value;

    if (role !== "admin") {
        return NextResponse.redirect(new URL("/entradas", req.url));
    }
  }

  return NextResponse.next();
}
