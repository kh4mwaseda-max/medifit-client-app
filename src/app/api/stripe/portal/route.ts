import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getTrainerId } from "@/lib/trainer-auth";
import { createServerClient } from "@/lib/supabase";

const BILLING_ENABLED = process.env.BILLING_ENABLED === "true";

// POST /api/stripe/portal — カスタマーポータル（解約・プラン変更）
export async function POST(req: NextRequest) {
  if (!BILLING_ENABLED) return NextResponse.json({ error: "Billing is not enabled" }, { status: 403 });
  const trainerId = await getTrainerId();
  if (!trainerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServerClient();
  const { data: trainer } = await supabase
    .from("trainers")
    .select("stripe_customer_id")
    .eq("id", trainerId)
    .single();

  if (!trainer?.stripe_customer_id) {
    return NextResponse.json({ error: "No subscription found" }, { status: 404 });
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: trainer.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/trainer/settings`,
  });

  return NextResponse.json({ url: session.url });
}
