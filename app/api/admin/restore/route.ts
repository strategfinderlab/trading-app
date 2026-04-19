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
      throw new Error("No URL provided");
    }

    console.log("FETCHING:", url);

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });

    console.log("FETCH STATUS:", res.status);

    const text = await res.text();
    console.log("RAW TEXT (first 300):", text.slice(0, 300));

    if (!text) {
      throw new Error("Empty response from blob");
    }

    let backup: any;

    try {
      backup = JSON.parse(text);
    } catch (e) {
      console.error("❌ JSON PARSE ERROR");
      throw new Error("Invalid JSON");
    }

    console.log("BACKUP TYPE:", typeof backup);
    console.log("IS ARRAY:", Array.isArray(backup));

    const entradas = Array.isArray(backup)
      ? backup
      : backup.entradas;

    if (!entradas) {
      throw new Error("No entradas found in backup");
    }

    console.log("ENTRADAS GROUPS:", entradas.length);

    // 🔥 BORRAR TODO
    await pool.query("DELETE FROM entradas");

    console.log("🗑️ TABLE CLEARED");

    // 🔥 INSERT CORRECTO (data anidada)
    for (const group of entradas) {

      if (!group.data || !Array.isArray(group.data)) continue;

      for (const row of group.data) {

        const keys = Object.keys(row).filter(k => k !== "id");

        const values = keys.map(k => {
          const v = row[k];
          return v === null || v === undefined ? null : String(v);
        });

        const query = `
          INSERT INTO entradas (${keys.join(",")})
          VALUES (${keys.map((_, i) => `$${i + 1}`).join(",")})
        `;

        await pool.query(query, values);
      }
    }

    console.log("✅ RESTORE COMPLETED");

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("❌ RESTORE ERROR:", err);

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}