import { NextResponse } from "next/server";

export async function GET() {
  const res = NextResponse.json({ ok: true });

  res.cookies.set("user", "", {
    path: "/",
    expires: new Date(0),
  });

  return res;
}