import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getTrainerId } from "@/lib/trainer-auth";
import { randomBytes } from "crypto";

/**
 * POST /api/trainer/invite
 * 招待トークンを生成してクライアントレコードに保存する。
 * Body: { name?: string, goal?: string }
 * Returns: { inviteUrl, token, clientId }
 */
export async function POST(req: NextRequest) {
  const trainerId = await getTrainerId();
  if (!trainerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, goal } = await req.json().catch(() => ({}));

  const supabase = createServerClient();

  // 招待トークン生成（16バイトhex = 32文字）
  const token = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7日有効

  // PIN生成（crypto.randomBytes使用）
  let pin: string | null = null;
  for (let i = 0; i < 10; i++) {
    const candidate = String(100000 + (randomBytes(3).readUIntBE(0, 3) % 900000));
    const { count } = await supabase.from("clients").select("id", { count: "exact", head: true }).eq("pin", candidate);
    if ((count ?? 1) === 0) { pin = candidate; break; }
  }
  if (!pin) return NextResponse.json({ error: "PIN生成に失敗しました" }, { status: 500 });

  const { data: client, error } = await supabase
    .from("clients")
    .insert({
      trainer_id: trainerId,
      name: name || "未設定",
      pin,
      goal: goal || null,
      invite_token: token,
      invite_expires_at: expiresAt,
      start_date: new Date().toISOString().split("T")[0],
    })
    .select("id, pin")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const inviteUrl = `${appUrl}/join/${token}`;

  return NextResponse.json({ inviteUrl, token, clientId: client.id, pin: client.pin });
}
