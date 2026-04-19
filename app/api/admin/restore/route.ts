import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(req: Request) {

  try {
    console.log("🔥 RESTORE START");

    const { url } = await req.json();

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });

    const text = await res.text();
    const backup = JSON.parse(text);

    const entradas = Array.isArray(backup)
      ? backup
      : backup.entradas;

    await pool.query("DELETE FROM entradas");

    for (const group of entradas) {

      if (!group.data) continue;

      for (const row of group.data) {

        await pool.query(
          `INSERT INTO entradas (data) VALUES ($1)`,
          [row] // 👈 JSON directo
        );
      }
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("❌ RESTORE ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}