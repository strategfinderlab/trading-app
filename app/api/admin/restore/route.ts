import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(req: Request) {

  try {
    console.log("🔥 RESTORE START");

    const { url } = await req.json();

    if (!url) {
      throw new Error("Missing url");
    }

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });

    const backup = JSON.parse(await res.text());

    if (!backup.entradas || !Array.isArray(backup.entradas)) {
      throw new Error("Invalid backup format");
    }

    for (const row of backup.entradas) {
      await pool.query(`
        INSERT INTO entradas (username, data)
        VALUES ($1, $2)
        ON CONFLICT (username)
        DO UPDATE SET data = EXCLUDED.data
      `, [row.username, JSON.stringify(row.data)]);
    }

    console.log("✅ RESTORE DONE");

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("❌ RESTORE ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}