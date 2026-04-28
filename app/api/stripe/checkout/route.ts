import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET() {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",

    allow_promotion_codes: true, // 👈 AQUÍ

    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: "Strategy Finder Lab",
          },
          unit_amount: 9700,
        },
        quantity: 1,
      },
    ],

    success_url: "https://strategyfinderlab.com/success",
    cancel_url: "https://strategyfinderlab.com/unete",
  });

  return NextResponse.redirect(session.url!);
}