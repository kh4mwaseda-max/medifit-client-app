import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { generateSessionToken } from "@/lib/trainer-auth";

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 60 * 60 * 1000; // 1時間
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const supabase = createServerClient();

  // IPレート制限
  const { data: attempt } = await supabase
    .from("register_attempts")
    .select("attempt_count, window_start")
    .eq("ip", ip)
    .single();

  if (attempt) {
    const windowAge = Date.now() - new Date(attempt.window_start).getTime();
    if (windowAge < WINDOW_MS && attempt.attempt_count >= MAX_ATTEMPTS) {
      return NextResponse.json({ error: "リクエストが多すぎます。しばらくしてから再試行してください。" }, { status: 429 });
    }
    if (windowAge >= WINDOW_MS) {
      await supabase.from("register_attempts").update({ attempt_count: 1, window_start: new Date().toISOString() }).eq("ip", ip);
    } else {
      await supabase.from("register_attempts").update({ attempt_count: attempt.attempt_count + 1 }).eq("ip", ip);
    }
  } else {
    await supabase.from("register_attempts").insert({ ip, attempt_count: 1, window_start: new Date().toISOString() });
  }

  const { name, user_type } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "名前は必須です" }, { status: 400 });
  }

  const { data: trainer, error } = await supabase
    .from("trainers")
    .insert({
      name: name.trim(),
      plan: "free",
      user_type: user_type === "individual" ? "individual" : "trainer",
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select("id, plan")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // DBにセッション保存
  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();
  await supabase.from("trainer_sessions").insert({
    trainer_id: trainer.id,
    session_token: sessionToken,
    expires_at: expiresAt,
  });

  const res = NextResponse.json({ ok: true, plan: trainer.plan });
  res.cookies.set("trainer_id", trainer.id, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  res.cookies.set("trainer_session", sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  return res;
}
