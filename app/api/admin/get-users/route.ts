import { NextResponse } from "next/server";
import { Pool } from "pg";
import { cookies } from "next/headers";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {

  try {

    const cookieStore = await cookies();
    const role = cookieStore.get("role")?.value;

    if (role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const result = await pool.query(
      `SELECT username, role FROM users ORDER BY username`
    );

    return NextResponse.json(result.rows);

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error servidor" }, { status: 500 });
  }
}