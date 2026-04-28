import { NextResponse } from "next/server";

export async function GET() {
  const res = NextResponse.json({ ok: true });

  res.cookies.delete("user");   // 👈 MEJOR
  res.cookies.delete("role");   // 👈 también

  return res;
}