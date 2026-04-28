import { NextResponse } from "next/server";
import { Pool } from "pg";
import { verifyPassword } from "@/lib/auth";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(req: Request) {
  const { username, password } = await req.json();

  const usernameClean = username.trim().toLowerCase();

  const result = await pool.query(
    `SELECT * FROM users WHERE username=$1`,
    [usernameClean]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Usuario no existe" }, { status: 401 });
  }

  const user = result.rows[0];

  // 🔥 PRIMER LOGIN
  if (!user.password) {
    return NextResponse.json({
      error: "FIRST_LOGIN"
    }, { status: 403 });
  }

  // 🔥 COMPARAR HASH
  const isValid = await verifyPassword(password, user.password);

  if (!isValid) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });

  res.cookies.set("user", username, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });
  res.cookies.set("role", user.role, { path: "/" });

  return res;
}