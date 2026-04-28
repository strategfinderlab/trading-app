import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Pool } from "pg";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(req: Request) {
  const body = await req.text();

  const sig = req.headers.get("stripe-signature")!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.log("❌ Error webhook:", err);
    return new Response("Webhook error", { status: 400 });
  }

  // 🎯 SOLO CUANDO SE PAGA
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const email = session.customer_details?.email;

    if (!email) return NextResponse.json({ ok: true });

    const username = email.trim().toLowerCase();

    // 🔥 CREAR USUARIO
    await pool.query(
      `INSERT INTO users (username, role, password)
       VALUES ($1, 'user', NULL)
       ON CONFLICT (username) DO NOTHING`,
      [username]
    );

    console.log("✅ Usuario creado:", username);

    // 🔥 ENVIAR EMAIL
    const res = await fetch("https://strategyfinderlab.com/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const text = await res.text();
    console.log("EMAIL RESPONSE:", res.status, text);
  }

  return NextResponse.json({ received: true });
}