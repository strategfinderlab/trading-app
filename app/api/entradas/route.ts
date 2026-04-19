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
     WHERE LOWER(username)=LOWER($1)`,
    [user]
  );

  if (result.rows.length === 0) {
    return NextResponse.json([]);
  }

  const rows = [];

  for (const row of result.rows) {
    let d = row.data;

    if (typeof d === "string") {
      try {
        d = JSON.parse(d);
      } catch {
        continue;
      }
    }

    // 🔥 IMPORTANTE: convertir a objeto plano
    if (Array.isArray(d)) {
      rows.push(...d);
    } else if (typeof d === "object" && d !== null) {
      rows.push(d);
    }
  }

  return NextResponse.json(rows);
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