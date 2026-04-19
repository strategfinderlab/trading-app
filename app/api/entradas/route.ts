// app/api/entradas/route.ts

import { NextResponse } from "next/server";
import { Pool } from "pg";
import { cookies } from "next/headers";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ✅ GET → cargar datos
export async function GET() {

  const cookieStore = await cookies();
  const user = cookieStore.get("user")?.value;

  if (!user) {
    return NextResponse.json([]);
  }

  const result = await pool.query(
    `SELECT data FROM entradas 
     WHERE LOWER(username)=LOWER($1)`,
    [user]
  );

  if (result.rows.length === 0) {
    return NextResponse.json([]);
  }

  const rows = [];

  for (const row of result.rows) {

    let d = row.data;

    // 🔥 caso: viene como string
    if (typeof d === "string") {
      try {
        d = JSON.parse(d);
      } catch {
        continue;
      }
    }

    // 🔥 CLAVE: si tiene .data dentro → usarlo
    if (d && typeof d === "object" && d.data) {
      rows.push(d.data);
    } else {
      rows.push(d);
    }
  }
    // 🔥 ORDENAR POR FECHA (de más antigua a más nueva)
    rows.sort((a, b) => {
      const parseDate = (str: string) => {
        if (!str) return 0;

        const [date, time] = str.split(" ");
        const [day, month, year] = date.split("/");

        return new Date(`${year}-${month}-${day}T${time || "00:00"}`).getTime();
      };

      return parseDate(a["Fecha"]) - parseDate(b["Fecha"]);
    });

    // 🔥 ELIMINAR DUPLICADOS (AQUÍ 👇)
    const unique = new Map();

    for (const row of rows) {
      const key = `${row.Par}-${row.Fecha}-${row["Direc"]}`;
      if (!unique.has(key)) {
        unique.set(key, row);
      }
    }

    const finalRows = Array.from(unique.values());

    return NextResponse.json(finalRows);
}


// ✅ POST → guardar datos
export async function POST(req: Request) {

  const cookieStore = await cookies();
  const user = cookieStore.get("user")?.value;

  const { data } = await req.json();

  if (!user || !data) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  await pool.query(
    `INSERT INTO entradas (username, data)
     VALUES ($1, $2)`,
    [user, JSON.stringify(data)]
  );

  return NextResponse.json({ ok: true });
}