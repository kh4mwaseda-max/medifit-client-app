import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { generateSessionToken } from "@/lib/trainer-auth";

const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 60 * 60 * 1000; // 1時間

/** GET /api/auth/magic?token=xxx */
export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.url;
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/trainer/login", baseUrl));

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const supabase = createServerClient();

  // IPレート制限
  const { data: attempt } = await supabase
    .from("magic_attempts")
    .select("attempt_count, window_start")
    .eq("ip", ip)
    .single();

  if (attempt) {
    const windowAge = Date.now() - new Date(attempt.window_start).getTime();
    if (windowAge < WINDOW_MS && attempt.attempt_count >= MAX_ATTEMPTS) {
      return NextResponse.redirect(new URL("/trainer/login?error=rate_limit", baseUrl));
    }
    if (windowAge >= WINDOW_MS) {
      await supabase.from("magic_attempts").update({ attempt_count: 1, window_start: new Date().toISOString() }).eq("ip", ip);
    } else {
      await supabase.from("magic_attempts").update({ attempt_count: attempt.attempt_count + 1 }).eq("ip", ip);
    }
  } else {
    await supabase.from("magic_attempts").insert({ ip, attempt_count: 1, window_start: new Date().toISOString() });
  }

  const { data: trainer } = await supabase
    .from("trainers")
    .select("id, magic_token_expires_at")
    .eq("magic_token", token)
    .single();

  if (!trainer || new Date(trainer.magic_token_expires_at) < new Date()) {
    return NextResponse.redirect(new URL("/trainer/login?error=expired", baseUrl));
  }

  // トークンを消費
  await supabase.from("trainers").update({ magic_token: null, magic_token_expires_at: null }).eq("id", trainer.id);

  // DBにセッション保存
  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();
  await supabase.from("trainer_sessions").insert({
    trainer_id: trainer.id,
    session_token: sessionToken,
    expires_at: expiresAt,
  });

  const res = NextResponse.redirect(new URL("/trainer", baseUrl));
  const isProd = process.env.NODE_ENV === "production";
  res.cookies.set("trainer_id", trainer.id, { httpOnly: true, secure: isProd, sameSite: "lax", maxAge: SESSION_MAX_AGE, path: "/" });
  res.cookies.set("trainer_session", sessionToken, { httpOnly: true, secure: isProd, sameSite: "lax", maxAge: SESSION_MAX_AGE, path: "/" });
  return res;
}
