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

    let rows: any[] = [];

    // 🔥 soporta TODOS los formatos posibles
    if (Array.isArray(backup)) {
      for (const item of backup) {

        if (item.data && Array.isArray(item.data)) {
          rows.push(...item.data);
        } else {
          rows.push(item);
        }

      }
    } else if (backup.entradas) {
      rows = backup.entradas;
    }

    console.log("TOTAL ROWS:", rows.length);

    // ⚠️ NO BORRAR (seguridad)
    // await pool.query("DELETE FROM entradas");

    for (const row of rows) {

      await pool.query(
        `INSERT INTO entradas (data) VALUES ($1)`,
        [row]
      );
    }

    console.log("✅ RESTORE COMPLETED");

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("❌ RESTORE ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}