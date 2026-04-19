import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(req: Request) {

  try {
    console.log("🔥 RESTORE START");

    const body = await req.json();
    console.log("BODY:", body);

    const { url } = body;

    if (!url) {
      throw new Error("No URL provided");
    }

    console.log("FETCHING URL:", url);

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });

    console.log("FETCH STATUS:", res.status);

    const text = await res.text();
    console.log("RAW TEXT:", text.slice(0, 500)); // solo primeros 500 chars

    if (!text) {
      throw new Error("Empty response from blob");
    }

    let backup: any;

    try {
      backup = JSON.parse(text);
    } catch (e) {
      console.error("❌ JSON PARSE ERROR");
      console.error(text);
      throw new Error("Invalid JSON");
    }

    console.log("BACKUP TYPE:", typeof backup);
    console.log("IS ARRAY:", Array.isArray(backup));

    const entradas = Array.isArray(backup)
      ? backup
      : backup.entradas;

    if (!entradas || !Array.isArray(entradas)) {
      throw new Error("Invalid backup structure (no entradas)");
    }

    console.log("ENTRADAS LENGTH:", entradas.length);
    console.log("FIRST ROW:", entradas[0]);

    console.log("🗑️ DELETING TABLE...");
    await pool.query("DELETE FROM entradas");

    console.log("📥 INSERTING DATA...");

    for (const row of entradas) {

      const keys = Object.keys(row);
      const values = Object.values(row);

      console.log("INSERT ROW:", keys);

      const query = `
        INSERT INTO entradas (${keys.join(",")})
        VALUES (${keys.map((_, i) => `$${i + 1}`).join(",")})
      `;

      await pool.query(query, values);
    }

    console.log("✅ RESTORE DONE");

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("❌ RESTORE ERROR FULL:", err);

    return NextResponse.json(
      {
        error: err.message,
        stack: err.stack,
      },
      { status: 500 }
    );
  }
}