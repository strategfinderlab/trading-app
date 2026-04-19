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

  console.log("👉 USER COOKIE:", user);   // 🔥 DEBUG 1

  if (!user) {
    console.log("❌ NO USER EN COOKIE");
    return NextResponse.json([]);
  }

  const result = await pool.query(
    `SELECT data FROM entradas 
     WHERE LOWER(username)=LOWER($1)
     ORDER BY id DESC LIMIT 1`,
    [user]
  );

  console.log("👉 RESULT DB:", result.rows);  // 🔥 DEBUG 2

  if (result.rows.length === 0) {
    console.log("❌ NO HAY DATOS EN BD");
    return NextResponse.json([]);
  }

  const data = result.rows[0].data;

  console.log("👉 DATA RAW:", data); // 🔥 DEBUG 3

  if (typeof data === "string") {
    return NextResponse.json(JSON.parse(data));
  }

  return NextResponse.json(Array.isArray(data) ? data : []);
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