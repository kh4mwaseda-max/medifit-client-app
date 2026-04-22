import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { hashPassword, generateSessionToken } from "@/lib/trainer-auth";

const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30日

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "email and password required" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data: trainer } = await supabase
    .from("trainers")
    .select("id, password_hash, plan")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (!trainer || !trainer.password_hash || trainer.password_hash !== hashPassword(password)) {
    return NextResponse.json({ error: "メールアドレスまたはパスワードが正しくありません" }, { status: 401 });
  }

  // DBにセッション保存
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();
  await supabase.from("trainer_sessions").insert({
    trainer_id: trainer.id,
    session_token: token,
    expires_at: expiresAt,
  });

  const isProd = process.env.NODE_ENV === "production";
  const res = NextResponse.json({ ok: true, plan: trainer.plan });
  res.cookies.set("trainer_id", trainer.id, { httpOnly: true, secure: isProd, sameSite: "lax", maxAge: SESSION_MAX_AGE, path: "/" });
  res.cookies.set("trainer_session", token, { httpOnly: true, secure: isProd, sameSite: "lax", maxAge: SESSION_MAX_AGE, path: "/" });
  return res;
}

export async function DELETE() {
  const supabase = createServerClient();
  const { cookies: cookieStore } = await import("next/headers");
  const store = await cookieStore();
  const sessionToken = store.get("trainer_session")?.value;

  // DBのセッションを削除
  if (sessionToken) {
    await supabase.from("trainer_sessions").delete().eq("session_token", sessionToken);
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.delete("trainer_id");
  res.cookies.delete("trainer_session");
  return res;
}
