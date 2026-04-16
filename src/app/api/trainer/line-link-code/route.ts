import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getTrainerId } from "@/lib/trainer-auth";
import { randomBytes } from "crypto";

/**
 * POST /api/trainer/line-link-code
 * トレーナー用LINE連携コードを生成して返す。
 * 生成したコードは trainers.line_link_code / line_link_code_expires_at に保存される。
 * トレーナーがLINEにそのコードを送ると webhook 側で自動連携。
 */
export async function POST() {
  const trainerId = await getTrainerId();
  if (!trainerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 6桁英数字コード生成（crypto使用、紛らわしい文字を除外）
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const buf = randomBytes(6);
  const code = Array.from(buf).map(b => chars[b % chars.length]).join("");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10分有効

  const supabase = createServerClient();
  const { error } = await supabase
    .from("trainers")
    .update({ line_link_code: code, line_link_code_expires_at: expiresAt })
    .eq("id", trainerId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ code, expiresAt });
}
