import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { createHash } from "crypto";

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15分

function hashPin(pin: string, clientId: string): string {
  return createHash("sha256").update(`${pin}:${clientId}`).digest("hex");
}

export async function POST(req: NextRequest) {
  const { clientId, pin } = await req.json();
  if (!clientId || !pin) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const supabase = createServerClient();
  const now = new Date();

  // Supabaseレート制限（永続化）
  const { data: record } = await supabase
    .from("pin_attempts")
    .select("attempt_count, locked_until")
    .eq("client_id", clientId)
    .eq("ip", ip)
    .single();

  if (record?.locked_until && new Date(record.locked_until) > now) {
    const minutesLeft = Math.ceil((new Date(record.locked_until).getTime() - now.getTime()) / 60000);
    return NextResponse.json(
      { error: `${MAX_ATTEMPTS}回失敗のためロックされています。${minutesLeft}分後に再試行してください。トレーナーにご連絡ください。` },
      { status: 429 }
    );
  }

  const { data: client } = await supabase
    .from("clients")
    .select("pin, pin_hash")
    .eq("id", clientId)
    .single();

  if (!client) {
    return NextResponse.json({ error: "クライアントが見つかりません" }, { status: 404 });
  }

  // ハッシュ比較（新方式）または平文比較（旧互換）
  const pinHash = hashPin(pin, clientId);
  const isValid = client.pin_hash
    ? client.pin_hash === pinHash
    : client.pin === pin; // 旧互換：次回ログイン時にハッシュへ移行

  if (!isValid) {
    const newCount = (record?.attempt_count ?? 0) + 1;
    const locked = newCount >= MAX_ATTEMPTS;
    const lockedUntil = locked ? new Date(now.getTime() + LOCK_DURATION_MS).toISOString() : null;

    if (record) {
      await supabase.from("pin_attempts").update({
        attempt_count: newCount,
        locked_until: lockedUntil,
        last_attempt_at: now.toISOString(),
      }).eq("client_id", clientId).eq("ip", ip);
    } else {
      await supabase.from("pin_attempts").insert({
        client_id: clientId,
        ip,
        attempt_count: newCount,
        locked_until: lockedUntil,
      });
    }

    if (locked) {
      return NextResponse.json(
        { error: `${MAX_ATTEMPTS}回失敗のためアカウントを15分ロックしました。トレーナーにご連絡ください。` },
        { status: 429 }
      );
    }
    const remaining = MAX_ATTEMPTS - newCount;
    return NextResponse.json(
      { error: `PINが正しくありません。あと${remaining}回失敗するとロックされます。` },
      { status: 401 }
    );
  }

  // 成功：ハッシュ移行（平文で保存されていた場合）
  if (!client.pin_hash) {
    await supabase.from("clients").update({ pin_hash: pinHash }).eq("id", clientId);
  }

  // レート制限リセット
  if (record) {
    await supabase.from("pin_attempts").delete().eq("client_id", clientId).eq("ip", ip);
  }

  const isProd = process.env.NODE_ENV === "production";
  const res = NextResponse.json({ ok: true });
  res.cookies.set(`client_auth_${clientId}`, "1", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}
