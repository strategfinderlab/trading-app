import { NextResponse } from "next/server";
import { list } from "@vercel/blob";

export async function GET(req: Request) {

  // 🔐 seguridad (igual que backup)
  const auth = req.headers.get("authorization");

  try {
    const blobs = await list();

    return NextResponse.json({
      backups: blobs.blobs
    });

  } catch (err) {
    return NextResponse.json({ error: "list error" }, { status: 500 });
  }
}
