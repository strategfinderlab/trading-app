import { NextResponse } from "next/server";
import { Pool } from "pg";
import { put, list, del } from "@vercel/blob";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(req: Request) {

  try {
    const entradas = await pool.query("SELECT * FROM entradas");

    const row = entradas.rows[0];

    const data = {
      username: row.username,
      estrategias: row.estrategias,
      entradas: row.data, // 🔥 AQUÍ ESTÁ LA CLAVE
    };

    const date = new Date();
    const filename = `backup-${date.toISOString().replace(/[:.]/g, "-")}.json`;
    const jsonString = JSON.stringify(data);

    const blob = await put(
      filename,
      new Blob([jsonString], { type: "application/json" }),
      {
        access: "private",
      }
    );

    // 🔥 LIMPIEZA (más de 14 días)
    const blobs = await list();

    const now = Date.now();
    const maxAge = 14 * 24 * 60 * 60 * 1000;

    for (const b of blobs.blobs) {
      const created = new Date(b.uploadedAt).getTime();

      if (now - created > maxAge) {
        await del(b.url);
      }
    }

    return NextResponse.json({
      success: true,
      url: blob.url
    });

  } catch (err: any) {
    console.error("BACKUP ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}