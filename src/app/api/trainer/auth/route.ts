import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { hashPassword } from "@/lib/trainer-auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "email and password required" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data: trainer } = await supabase
    .from("trainers")
    .select("id, password_hash, plan")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (!trainer || trainer.password_hash !== hashPassword(password)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, plan: trainer.plan });
  res.cookies.set("trainer_id", trainer.id, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  // 後方互換: 旧 trainer_session も残しておく（移行期間）
  res.cookies.set("trainer_session", process.env.TRAINER_SESSION_TOKEN ?? "legacy", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("trainer_id");
  res.cookies.delete("trainer_session");
  return res;
}
