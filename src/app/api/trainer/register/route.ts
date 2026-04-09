import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { hashPassword } from "@/lib/trainer-auth";

export async function POST(req: NextRequest) {
  const { name, email, password, user_type } = await req.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: "name, email, password required" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "パスワードは6文字以上" }, { status: 400 });
  }

  const supabase = createServerClient();

  // 重複チェック
  const { data: existing } = await supabase
    .from("trainers")
    .select("id")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (existing) {
    return NextResponse.json({ error: "このメールアドレスは既に登録されています" }, { status: 409 });
  }

  const { data: trainer, error } = await supabase
    .from("trainers")
    .insert({
      name,
      email: email.toLowerCase().trim(),
      password_hash: hashPassword(password),
      plan: "free",
      user_type: user_type === "individual" ? "individual" : "trainer",
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select("id, plan")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const res = NextResponse.json({ ok: true, plan: trainer.plan });
  res.cookies.set("trainer_id", trainer.id, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}
