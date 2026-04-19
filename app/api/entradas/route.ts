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
    `SELECT data FROM entradas 
     WHERE LOWER(username)=LOWER($1)
     ORDER BY id DESC`,
    [user]
  );

  if (result.rows.length === 0) {
    return NextResponse.json([]);
  }

  // 🔥 juntar todos los registros
  const allData = result.rows.flatMap(row => {
    const d = row.data;

    if (typeof d === "string") {
      try {
        return JSON.parse(d);
      } catch {
        return [];
      }
    }

    return Array.isArray(d) ? d : [d];
  });

  return NextResponse.json(allData);
}


// ✅ POST → guardar datos
export async function POST(req: Request) {

  const cookieStore = await cookies();
  const user = cookieStore.get("user")?.value;

  const { data } = await req.json();

  if (!user || !data) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  await pool.query(
    `INSERT INTO entradas (username, data)
     VALUES ($1, $2)`,
    [user, JSON.stringify(data)]
  );

  return NextResponse.json({ ok: true });
}