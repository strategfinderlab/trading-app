import { NextResponse } from "next/server";
import { Pool } from "pg";
import { cookies } from "next/headers";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(req: Request) {

  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value;

  if (role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { username } = await req.json();

  const usernameClean = username.trim().toLowerCase();

  await pool.query(
    `INSERT INTO users (username, role, password)
    VALUES ($1, 'user', NULL)
    ON CONFLICT (username) DO NOTHING`,
    [usernameClean]
  );

  return NextResponse.json({ ok: true });
}