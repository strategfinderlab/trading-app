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

    if (!res.ok) {
      throw new Error(`Download failed (${res.status})`);
    }

    const backup = JSON.parse(await res.text());

    if (!Array.isArray(backup)) {
      throw new Error("Invalid backup format");
    }

    for (const row of backup) {
      await pool.query(
        `
        INSERT INTO entradas (
          username,
          data,
          estrategias
        )
        VALUES (
          $1,
          $2,
          $3
        )
        ON CONFLICT (username)
        DO UPDATE SET
          data = EXCLUDED.data,
          estrategias = EXCLUDED.estrategias
        `,
        [
          row.username,
          JSON.stringify(row.entradas ?? []),
          row.estrategias ?? null,
        ]
      );
    }

    console.log(`✅ RESTORE DONE (${backup.length} usuarios)`);

    return NextResponse.json({
      success: true,
      restored: backup.length,
    });

  } catch (err: any) {
    console.error("❌ RESTORE ERROR:", err);

    return NextResponse.json(
      {
        error: err.message,
      },
      { status: 500 }
    );
  }
}