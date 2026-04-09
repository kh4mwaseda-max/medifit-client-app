import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { hashPassword } from "@/lib/trainer-auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password } = body;

  if (!password) {
    return NextResponse.json({ error: "email and password required" }, { status: 400 });
  }

  // ── フォールバック: env ベース認証（migration未実施 or オーナー直接ログイン）──
  if (password === process.env.TRAINER_PASSWORD) {
    const trainerId = process.env.TRAINER_ID!;
    const res = NextResponse.json({ ok: true, plan: "pro" });
    res.cookies.set("trainer_id", trainerId, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/" });
    res.cookies.set("trainer_session", process.env.TRAINER_SESSION_TOKEN!, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/" });
    return res;
  }

  // ── DBベース認証（migration実施後）──
  if (!email) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const supabase = createServerClient();
  const { data: trainer } = await supabase
    .from("trainers")
    .select("id, password_hash, plan")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (!trainer || !trainer.password_hash || trainer.password_hash !== hashPassword(password)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, plan: trainer.plan });
  res.cookies.set("trainer_id", trainer.id, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/" });
  res.cookies.set("trainer_session", process.env.TRAINER_SESSION_TOKEN ?? "legacy", { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/" });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("trainer_id");
  res.cookies.delete("trainer_session");
  return res;
}
