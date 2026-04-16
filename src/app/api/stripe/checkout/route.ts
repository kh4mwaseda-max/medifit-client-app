import { NextRequest, NextResponse } from "next/server";
import { getStripe, PRO_PRICE_ID } from "@/lib/stripe";
import { getTrainerId } from "@/lib/trainer-auth";
import { createServerClient } from "@/lib/supabase";

const BILLING_ENABLED = process.env.BILLING_ENABLED === "true";

// POST /api/stripe/checkout — Proプランのチェックアウトセッション作成
export async function POST(req: NextRequest) {
  if (!BILLING_ENABLED) return NextResponse.json({ error: "Billing is not enabled" }, { status: 403 });
  const trainerId = await getTrainerId();
  if (!trainerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServerClient();
  const { data: trainer } = await supabase
    .from("trainers")
    .select("id, name, email, stripe_customer_id, plan")
    .eq("id", trainerId)
    .single();

  if (!trainer) return NextResponse.json({ error: "Trainer not found" }, { status: 404 });
  if (trainer.plan === "pro") return NextResponse.json({ error: "Already Pro" }, { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  // Stripeカスタマー作成 or 既存使用
  let customerId = trainer.stripe_customer_id;
  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: trainer.email ?? undefined,
      name: trainer.name ?? undefined,
      metadata: { trainer_id: trainerId },
    });
    customerId = customer.id;
    await supabase
      .from("trainers")
      .update({ stripe_customer_id: customerId })
      .eq("id", trainerId);
  }

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: PRO_PRICE_ID, quantity: 1 }],
    success_url: `${appUrl}/trainer/settings?upgraded=1`,
    cancel_url: `${appUrl}/trainer/settings`,
    metadata: { trainer_id: trainerId },
    subscription_data: {
      metadata: { trainer_id: trainerId },
    },
    locale: "ja",
  });

  return NextResponse.json({ url: session.url });
}
