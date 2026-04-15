import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

/** GET /api/join/[token] — トークン検証 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = createServerClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, name, trainer_id, invite_expires_at")
    .eq("invite_token", token)
    .single();

  if (!client) return NextResponse.json({ valid: false });

  if (new Date(client.invite_expires_at) < new Date()) {
    return NextResponse.json({ valid: false, reason: "expired" });
  }

  const { data: trainer } = await supabase
    .from("trainers")
    .select("name")
    .eq("id", client.trainer_id)
    .single();

  return NextResponse.json({
    valid: true,
    trainerName: trainer?.name ?? "トレーナー",
    clientName: client.name,
    clientId: client.id,
  });
}

/** POST /api/join/[token] — 名前確定 → 招待完了 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: "名前は必須です" }, { status: 400 });

  const supabase = createServerClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, trainer_id, invite_expires_at, pin")
    .eq("invite_token", token)
    .single();

  if (!client) return NextResponse.json({ error: "招待リンクが無効です" }, { status: 404 });
  if (new Date(client.invite_expires_at) < new Date()) {
    return NextResponse.json({ error: "招待リンクの有効期限が切れています" }, { status: 410 });
  }

  // 名前を確定 → トークンを無効化
  const { error } = await supabase
    .from("clients")
    .update({
      name,
      invite_token: null,
      invite_expires_at: null,
    })
    .eq("id", client.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // トレーナーへ通知（ソロテストモード: クライアントのLINEに送る）
  const { data: trainer } = await supabase
    .from("trainers")
    .select("line_notify_user_id, name")
    .eq("id", client.trainer_id)
    .single();

  // ソロテストモード時はクライアントのline_user_idを取得して通知先にする
  const isSolo = process.env.SOLO_TEST_MODE === "true";
  let notifyTarget = trainer?.line_notify_user_id;
  if (isSolo) {
    const { data: updatedClient } = await supabase
      .from("clients")
      .select("line_user_id")
      .eq("id", client.id)
      .single();
    notifyTarget = updatedClient?.line_user_id ?? trainer?.line_notify_user_id;
  }

  if (notifyTarget) {
    const { pushMessage } = await import("@/lib/line");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    await pushMessage(
      notifyTarget,
      `${isSolo ? "【トレーナー通知】" : ""}📋 ${name} さんが招待リンクから登録しました！\n${appUrl}/trainer/clients/${client.id}`
    ).catch(() => {});
  }

  return NextResponse.json({ ok: true, clientId: client.id, pin: client.pin });
}
