import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: Request) {

  try {

    const { email, oldPassword, newPassword, repeatPassword } = await req.json();

    // ================= VALIDACIONES =================
    if (!email || !oldPassword || !newPassword || !repeatPassword) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    if (newPassword !== repeatPassword) {
      return NextResponse.json({ error: "Las contraseñas no coinciden" }, { status: 400 });
    }

    // ================= BUSCAR USUARIO =================
    const user = await sql`
      SELECT * FROM users WHERE email = ${email}
    `;

    if (user.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const userData = user[0];

    // ================= VALIDAR PASSWORD ACTUAL =================
    const isValid = await bcrypt.compare(oldPassword, userData.password);

    if (!isValid) {
      return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 401 });
    }

    // ================= HASH NUEVA PASSWORD =================
    const hashed = await bcrypt.hash(newPassword, 10);

    // ================= ACTUALIZAR =================
    await sql`
      UPDATE users
      SET password = ${hashed}
      WHERE email = ${email}
    `;

    return NextResponse.json({ success: true });

  } catch (err) {
    return NextResponse.json({ error: "Error servidor" }, { status: 500 });
  }

}