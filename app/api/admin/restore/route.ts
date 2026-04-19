import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(req: Request) {

  //const auth = req.headers.get("authorization");

  //if (auth !== `Bearer ${process.env.BACKUP_SECRET}`) {
    //return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  //}

  try {
    const { url } = await req.json();

    const res = await fetch(url);

    console.log("FETCH STATUS:", res.status);

    const text = await res.text();
    console.log("RAW RESPONSE:", text);

    const backup = JSON.parse(text);

    console.log("PARSED BACKUP:", backup);

    const entradas = Array.isArray(backup) ? backup : backup.entradas;

    // ⚠️ BORRAR TODO
    await pool.query("DELETE FROM entradas");

    for (const row of entradas) {

      const keys = Object.keys(row);
      const values = Object.values(row);

      const query = `
        INSERT INTO entradas (${keys.join(",")})
        VALUES (${keys.map((_, i) => `$${i + 1}`).join(",")})
      `;

      await pool.query(query, values);
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    return NextResponse.json({ error: "restore error" }, { status: 500 });
  }
}