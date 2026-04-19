import { NextResponse } from "next/server";
import { Pool } from "pg";
import { put } from "@vercel/blob";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(req: Request) {

  // 🔐 permitir cron de Vercel o acceso manual con secret
  const isCron = req.headers.get("user-agent")?.includes("vercel");

  if (!isCron) {
    const auth = req.headers.get("authorization");

    if (auth !== `Bearer ${process.env.BACKUP_SECRET}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  try {
    // 👉 puedes añadir más tablas aquí
    const entradas = await pool.query("SELECT * FROM entradas");
    // const usuarios = await pool.query("SELECT * FROM users");

    const data = {
      entradas: entradas.rows,
      // usuarios: usuarios.rows
    };

    // 🔥 evitar ":" en nombre (problemas en algunos sistemas)
    const date = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup-${date}.json`;

    const blob = await put(filename, JSON.stringify(data), {
      access: "private",
    });

    return NextResponse.json({
      success: true,
      url: blob.url
    });

  } catch (err) {
    return NextResponse.json({ error: "backup error" }, { status: 500 });
  }
}
