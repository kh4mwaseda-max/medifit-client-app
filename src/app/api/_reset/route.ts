/**
 * POST /api/_reset
 * 全データリセット（開発・テスト用）
 * 本番では環境変数 ALLOW_RESET=true が必要
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  // 安全弁: 環境変数で明示的に許可されていなければ拒否
  if (process.env.ALLOW_RESET !== "true") {
    return NextResponse.json(
      { error: "Reset is disabled. Set ALLOW_RESET=true to enable." },
      { status: 403 }
    );
  }

  const supabase = createServerClient();

  // trainers を削除すれば ON DELETE CASCADE で全子テーブルが消える
  // (clients, body_records, training_sessions, training_sets, meal_records,
  //  body_photos, assessments, client_goals, line_parse_logs,
  //  scheduled_sessions, trainer_policies, line_image_usage)
  const { error: trainersError } = await supabase
    .from("trainers")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // 全行削除（ダミー条件）

  if (trainersError) {
    return NextResponse.json(
      { error: `trainers削除失敗: ${trainersError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "全データをリセットしました。トレーナー・クライアント・記録すべて削除済み。",
  });
}
