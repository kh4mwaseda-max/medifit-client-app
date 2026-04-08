import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { pushMessage } from "@/lib/line";
import type { ReportData } from "../route";

// POST /api/trainer/report/send — 週次/月次レポートをLINEで送信
export async function POST(req: NextRequest) {
  const { clientId, report }: { clientId: string; report: ReportData } = await req.json();
  if (!clientId || !report) {
    return NextResponse.json({ error: "clientId and report required" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data: client } = await supabase
    .from("clients")
    .select("name, line_user_id")
    .eq("id", clientId)
    .single();

  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  if (!client.line_user_id) {
    return NextResponse.json({ error: "クライアントがLINE連携していません" }, { status: 400 });
  }

  const periodLabel = report.period === "weekly" ? "週次" : "月次";
  const lines: string[] = [
    `📊 ${periodLabel}レポート（${report.label}）`,
    `${client.name} さんの記録です🎯`,
    ``,
  ];

  // 身体変化
  if (report.weight_end != null || report.body_fat_end != null) {
    lines.push(`【身体変化】`);
    if (report.weight_end != null) {
      const d = report.weight_diff;
      lines.push(`⚖️ 体重: ${report.weight_end}kg ${d != null ? `（${d > 0 ? "+" : ""}${d}kg）` : ""}`);
    }
    if (report.body_fat_end != null) {
      const d = report.body_fat_diff;
      lines.push(`📉 体脂肪率: ${report.body_fat_end}% ${d != null ? `（${d > 0 ? "+" : ""}${d}%）` : ""}`);
    }
    if (report.muscle_end != null) {
      const d = report.muscle_diff;
      lines.push(`💪 筋肉量: ${report.muscle_end}kg ${d != null ? `（${d > 0 ? "+" : ""}${d}kg）` : ""}`);
    }
    lines.push(``);
  }

  // トレーニング
  if (report.training_sessions > 0) {
    lines.push(`【トレーニング】`);
    lines.push(`🏋 ${report.training_sessions}回 / ${report.total_sets}セット`);
    lines.push(`🔋 総ボリューム: ${(report.total_volume_kg / 1000).toFixed(1)}t`);
    if (report.training_achievement_pct != null) {
      const emoji = report.training_achievement_pct >= 100 ? "✅" : report.training_achievement_pct >= 70 ? "⚠️" : "❌";
      lines.push(`${emoji} 目標達成率: ${report.training_achievement_pct}%`);
    }
    if (report.top_exercises.length > 0) {
      lines.push(`主な種目: ${report.top_exercises.slice(0, 3).map((e) => e.name).join("・")}`);
    }
    lines.push(``);
  }

  // 食事
  if (report.avg_calories != null) {
    lines.push(`【食事（日平均 / ${report.logged_days}日記録）】`);
    lines.push(`🔥 ${report.avg_calories} kcal`);
    if (report.avg_protein_g) lines.push(`💪 P: ${report.avg_protein_g}g`);
    if (report.avg_fat_g)     lines.push(`🫙 F: ${report.avg_fat_g}g`);
    if (report.avg_carbs_g)   lines.push(`🍚 C: ${report.avg_carbs_g}g`);
    if (report.calorie_achievement_pct != null) {
      const emoji = report.calorie_achievement_pct >= 90 && report.calorie_achievement_pct <= 110 ? "✅"
        : report.calorie_achievement_pct >= 70 ? "⚠️" : "❌";
      lines.push(`${emoji} カロリー達成率: ${report.calorie_achievement_pct}%`);
    }
    lines.push(``);
  }

  lines.push(`引き続き頑張りましょう💪`);
  lines.push(`ダッシュボードで詳細を確認できます📈`);

  try {
    await pushMessage(client.line_user_id, lines.join("\n"));
  } catch (e: any) {
    return NextResponse.json({ error: `LINE送信エラー: ${e.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
