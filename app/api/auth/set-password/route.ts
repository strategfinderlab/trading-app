import { NextResponse } from "next/server";
import { Pool } from "pg";
import { hashPassword } from "@/lib/auth"; // 👈 ESTO FALTABA

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(req: Request) {
  const body = await req.json();

  console.log("BODY:", body);

  const rawUsername = body.username || body.email;

  if (!rawUsername) {
    return NextResponse.json(
      { error: "Falta username/email" },
      { status: 400 }
    );
  }

  const usernameClean = rawUsername.trim().toLowerCase();
  const password = body.password;

  const hashed = await hashPassword(password);

  const result = await pool.query(
    `UPDATE users SET password=$1 WHERE username=$2`,
    [hashed, usernameClean]
  );

  console.log("UPDATE RESULT:", result.rowCount);
  console.log("USERNAME:", usernameClean);

  if (result.rowCount === 0) {
    return NextResponse.json(
      { error: "Usuario no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}