import { NextResponse } from "next/server";
import { Pool } from "pg";
import { put, list, del } from "@vercel/blob";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(req: Request) {
  try {

    const result = await pool.query("SELECT * FROM entradas");

    const data = result.rows.map(row => ({
      username: row.username,
      estrategias: row.estrategias,
      entradas: typeof row.data === "string"
        ? JSON.parse(row.data)
        : row.data
    }));

    const date = new Date();
    const filename = `backup-${date.toISOString().replace(/[:.]/g, "-")}.json`;

    const blob = await put(
      filename,
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      { access: "private" }
    );

    // 🔥 limpiar backups antiguos
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