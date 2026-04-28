import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {

  const { pathname } = req.nextUrl;

  // 🔥 RUTAS PÚBLICAS
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/unete") ||
    pathname.startsWith("/success") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const user = req.cookies.get("user");

  // 🔒 SOLO PROTEGER PRIVADAS
  if (!user || !user.value) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 🔐 ADMIN
  if (pathname.startsWith("/admin")) {
    const role = req.cookies.get("role")?.value;

    if (role !== "admin") {
      return NextResponse.redirect(new URL("/entradas", req.url));
    }
  }

  return NextResponse.next();
}