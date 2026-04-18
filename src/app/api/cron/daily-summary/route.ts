/**
 * GET /api/cron/daily-summary
 * Vercel Cron から毎朝 JST 7:00 (UTC 22:00) に呼ばれる。
 * 各トレーナーへ、自分のクライアント全員の「昨日(JST)」のデータまとめをLINEで送る。
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { pushMessage } from "@/lib/line";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function jstYesterdayDate(): string {
  // 現在のUTC時刻を取得 → JSTに変換 → 前日の日付（YYYY-MM-DD）
  const nowUtc = new Date();
  const jst = new Date(nowUtc.getTime() + 9 * 60 * 60 * 1000);
  jst.setUTCDate(jst.getUTCDate() - 1);
  return jst.toISOString().split("T")[0];
}

export async function GET(req: NextRequest) {
  // Vercel Cron 認証
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const yesterday = jstYesterdayDate();
  const supabase = createServerClient();
  const isSolo = process.env.SOLO_TEST_MODE === "true";

  // 全トレーナー取得
  const { data: trainers, error: trainerErr } = await supabase
    .from("trainers")
    .select("id, name, line_notify_user_id");
  if (trainerErr) return NextResponse.json({ error: trainerErr.message }, { status: 500 });

  let sentCount = 0;
  const results: any[] = [];

  for (const trainer of trainers ?? []) {
    // クライアント一覧
    const { data: clients } = await supabase
      .from("clients")
      .select("id, name, line_user_id")
      .eq("trainer_id", trainer.id);

    if (!clients || clients.length === 0) continue;

    // 各クライアントの昨日データを並列取得
    const clientSummaries = await Promise.all(
      clients.map(async (c) => {
        const [bodyRes, sessionsRes, mealsRes] = await Promise.all([
          supabase
            .from("body_records")
            .select("weight_kg, body_fat_pct, muscle_mass_kg")
            .eq("client_id", c.id)
            .eq("recorded_at", yesterday)
            .order("created_at", { ascending: false })
            .limit(1),
          supabase
            .from("training_sessions")
            .select("id, notes")
            .eq("client_id", c.id)
            .eq("session_date", yesterday),
          supabase
            .from("meal_records")
            .select("calories, protein_g, fat_g, carbs_g")
            .eq("client_id", c.id)
            .eq("meal_date", yesterday),
        ]);

        const body = bodyRes.data?.[0] ?? null;
        const sessions = sessionsRes.data ?? [];
        const meals = mealsRes.data ?? [];

        // セッションIDからセット数とボリュームを集計
        let totalSets = 0;
        let totalVolume = 0;
        if (sessions.length > 0) {
          const sessionIds = sessions.map((s) => s.id);
          const { data: sets } = await supabase
            .from("training_sets")
            .select("weight_kg, reps")
            .in("session_id", sessionIds);
          totalSets = sets?.length ?? 0;
          totalVolume = (sets ?? []).reduce(
            (sum, s) => sum + (Number(s.weight_kg) || 0) * (Number(s.reps) || 0),
            0,
          );
        }

        // 食事合計
        const mealTotal = meals.reduce(
          (acc, m) => ({
            cal: acc.cal + (m.calories ?? 0),
            p: acc.p + (Number(m.protein_g) || 0),
            f: acc.f + (Number(m.fat_g) || 0),
            c: acc.c + (Number(m.carbs_g) || 0),
          }),
          { cal: 0, p: 0, f: 0, c: 0 },
        );

        return {
          name: c.name,
          lineUserId: c.line_user_id,
          body,
          sessions: sessions.length,
          totalSets,
          totalVolume,
          meals: meals.length,
          mealTotal,
          hasAnyData: !!body || sessions.length > 0 || meals.length > 0,
        };
      }),
    );

    // 記録あり/なしを分離
    const withData = clientSummaries.filter((s) => s.hasAnyData);
    const noData = clientSummaries.filter((s) => !s.hasAnyData);

    // 全員無記録ならスキップ
    if (withData.length === 0) {
      results.push({ trainer: trainer.name, status: "skipped_no_data" });
      continue;
    }

    // メッセージ構築
    const lines: string[] = [
      `☀️ おはようございます、${trainer.name} さん`,
      `📊 ${yesterday} のクライアント記録まとめ`,
      ``,
    ];

    for (const s of withData) {
      lines.push(`━━━━━━━━━━━━`);
      lines.push(`👤 ${s.name}`);
      if (s.body) {
        const parts: string[] = [];
        if (s.body.weight_kg != null) parts.push(`⚖️ ${s.body.weight_kg}kg`);
        if (s.body.body_fat_pct != null) parts.push(`📉 ${s.body.body_fat_pct}%`);
        if (s.body.muscle_mass_kg != null) parts.push(`💪 ${s.body.muscle_mass_kg}kg`);
        if (parts.length) lines.push(`   ${parts.join(" / ")}`);
      }
      if (s.sessions > 0) {
        lines.push(`   🏋 ${s.sessions}セッション・${s.totalSets}セット・${(s.totalVolume / 1000).toFixed(1)}t`);
      }
      if (s.meals > 0) {
        lines.push(
          `   🍽 ${s.mealTotal.cal}kcal (P${Math.round(s.mealTotal.p)}/F${Math.round(s.mealTotal.f)}/C${Math.round(s.mealTotal.c)})`,
        );
      }
    }

    lines.push(`━━━━━━━━━━━━`);

    if (noData.length > 0) {
      lines.push(``);
      lines.push(`📭 記録なし: ${noData.map((s) => s.name).join("・")}`);
    }

    lines.push(``);
    lines.push(`🔗 ${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/trainer`);

    const messageText = lines.join("\n");

    // 送信先決定（ソロモード: 1人目のクライアントのLINE宛 / 通常: トレーナーのline_notify_user_id）
    const target = isSolo
      ? clientSummaries.find((s) => s.lineUserId)?.lineUserId ?? trainer.line_notify_user_id
      : trainer.line_notify_user_id;

    if (!target) {
      results.push({ trainer: trainer.name, status: "no_target" });
      continue;
    }

    try {
      await pushMessage(target, isSolo ? `【トレーナー通知】\n${messageText}` : messageText);
      sentCount++;
      results.push({ trainer: trainer.name, status: "sent", target });
    } catch (e: any) {
      results.push({ trainer: trainer.name, status: "error", error: e.message });
    }
  }

  return NextResponse.json({ ok: true, yesterday, sentCount, results });
}
