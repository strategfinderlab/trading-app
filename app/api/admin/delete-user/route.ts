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

  // 🔒 1. NO permitir borrar admin
  if (username === "cristianblesa@hotmail.com") {
    return NextResponse.json(
      { error: "No puedes borrar el admin" },
      { status: 400 }
    );
  }

  // 🔥 2. borrar datos del usuario (tabla entradas)
  await pool.query(
    `DELETE FROM entradas WHERE username=$1`,
    [username]
  );

  // 🔥 3. borrar usuario
  await pool.query(
    `DELETE FROM users WHERE username=$1`,
    [username]
  );

  return NextResponse.json({ ok: true });
}