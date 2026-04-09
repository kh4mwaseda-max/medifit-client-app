import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getTrainerId } from "@/lib/trainer-auth";
import { createServerClient } from "@/lib/supabase";

// POST /api/stripe/portal — カスタマーポータル（解約・プラン変更）
export async function POST(req: NextRequest) {
  const trainerId = await getTrainerId() ?? process.env.TRAINER_ID;
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

  const session = await stripe.billingPortal.sessions.create({
    customer: trainer.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/trainer/settings`,
  });

  return NextResponse.json({ url: session.url });
}
