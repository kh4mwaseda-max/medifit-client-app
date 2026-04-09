import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

export const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID!;
