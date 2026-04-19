import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(req: Request) {

  const auth = req.headers.get("authorization");

  if (auth !== `Bearer ${process.env.BACKUP_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await pool.query("SELECT * FROM entradas");

    return NextResponse.json({
      success: true,
      data: result.rows
    });

  } catch (err) {
    return NextResponse.json({ error: "backup error" }, { status: 500 });
  }
}
