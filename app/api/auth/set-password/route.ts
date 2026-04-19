import { NextResponse } from "next/server";
import { Pool } from "pg";
import { hashPassword } from "@/lib/auth";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const hashed = await hashPassword(password);

  await pool.query(
    `UPDATE users
     SET password=$1
     WHERE username=$2`,
    [hashed, email]
  );

  return NextResponse.json({ ok: true });
}