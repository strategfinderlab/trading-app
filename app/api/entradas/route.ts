// app/api/entradas/route.ts

import { NextResponse } from "next/server";
import { Pool } from "pg";
import { cookies } from "next/headers";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ✅ GET → cargar datos
export async function GET() {

  const cookieStore = await cookies();
  const user = cookieStore.get("user")?.value;

  if (!user) {
    return NextResponse.json([]);
  }

  const result = await pool.query(
    `SELECT data FROM entradas WHERE LOWER(username)=LOWER($1)`,
    [user]
  );

  if (result.rows.length === 0) {
    return NextResponse.json([]);
  }

  let data = result.rows[0].data;

  if (typeof data === "string") {
    data = JSON.parse(data);
  }

  return NextResponse.json(data);
}


// ✅ POST → guardar datos
export async function POST(req: Request) {

  const cookieStore = await cookies();
  const user = cookieStore.get("user")?.value;

  const { data } = await req.json();

  if (!user || !data) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  await pool.query(`
    INSERT INTO entradas (username, data)
    VALUES ($1, $2)
    ON CONFLICT (username)
    DO UPDATE SET data = EXCLUDED.data
  `, [user, JSON.stringify(data)]);

  return NextResponse.json({ ok: true });
}