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

    const backup = JSON.parse(await res.text());

    let rows: any[] = [];

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

    if (rows.length === 0) {
      throw new Error("No data to restore");
    }

    // ⚠️ NO BORRAR (todavía)
    // await pool.query("DELETE FROM entradas");

    // 🔥 INSERT MASIVO
    const values = rows.map((row, i) => `($${i + 1})`).join(",");

    await pool.query(
      `INSERT INTO entradas (data) VALUES ${values}`,
      rows
    );

    console.log("✅ RESTORE DONE");

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("❌ RESTORE ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}