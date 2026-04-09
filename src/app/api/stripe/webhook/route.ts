import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServerClient } from "@/lib/supabase";
import Stripe from "stripe";

export const config = { api: { bodyParser: false } };

// POST /api/stripe/webhook — Stripeイベント受信
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const supabase = createServerClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const trainerId = session.metadata?.trainer_id;
      if (trainerId && session.mode === "subscription") {
        await supabase
          .from("trainers")
          .update({
            plan: "pro",
            stripe_subscription_id: session.subscription as string,
            stripe_customer_id: session.customer as string,
          })
          .eq("id", trainerId);
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const trainerId = sub.metadata?.trainer_id;
      if (trainerId) {
        const isActive = ["active", "trialing"].includes(sub.status);
        await supabase
          .from("trainers")
          .update({ plan: isActive ? "pro" : "free" })
          .eq("id", trainerId);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const trainerId = sub.metadata?.trainer_id;
      if (trainerId) {
        await supabase
          .from("trainers")
          .update({ plan: "free", stripe_subscription_id: null })
          .eq("id", trainerId);
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
