/**
 * LINE画像送信カウント管理ユーティリティ
 * トレーナーごとの月次送信数を line_image_usage テーブルで管理する。
 *
 * 上限の考え方:
 *   130枚以上 → トレーナーへ警告プッシュ通知
 *   150枚以上 → トレーナーへブロック警告プッシュ通知 + 画像送信をスキップさせる
 */

import { createServerClient } from "@/lib/supabase";
import { pushMessage } from "@/lib/line";

const WARN_THRESHOLD = 130;
const BLOCK_THRESHOLD = 150;

/** 現在の年月を "YYYY-MM" 形式で返す */
function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * 画像送信カウントをインクリメントする（upsert）。
 * @returns 更新後のカウント数
 */
export async function incrementImageCount(trainerId: string): Promise<number> {
  const supabase = createServerClient();
  const yearMonth = currentYearMonth();

  // upsert: 既存行があれば count+1、なければ count=1 で INSERT
  const { data, error } = await supabase.rpc("increment_line_image_count", {
    p_trainer_id: trainerId,
    p_year_month: yearMonth,
  });

  if (error) {
    // RPC が未登録の場合に備えたフォールバック（read-modify-write）
    console.error("[line-usage] RPC error, falling back to manual upsert:", error.message);
    return incrementImageCountFallback(trainerId, yearMonth);
  }

  return (data as number) ?? 0;
}

/** RPC が使えない場合のフォールバック実装 */
async function incrementImageCountFallback(trainerId: string, yearMonth: string): Promise<number> {
  const supabase = createServerClient();

  const { data: existing } = await supabase
    .from("line_image_usage")
    .select("id, count")
    .eq("trainer_id", trainerId)
    .eq("year_month", yearMonth)
    .single();

  if (existing) {
    const newCount = (existing.count ?? 0) + 1;
    const { error } = await supabase
      .from("line_image_usage")
      .update({ count: newCount })
      .eq("id", existing.id);
    if (error) console.error("[line-usage] update error:", error.message);
    return newCount;
  } else {
    const { data: inserted, error } = await supabase
      .from("line_image_usage")
      .insert({ trainer_id: trainerId, year_month: yearMonth, count: 1 })
      .select("count")
      .single();
    if (error) console.error("[line-usage] insert error:", error.message);
    return inserted?.count ?? 1;
  }
}

/**
 * 今月の画像送信数を取得する。
 * @returns 今月のカウント数（レコードがない場合は 0）
 */
export async function getImageCount(trainerId: string): Promise<number> {
  const supabase = createServerClient();
  const yearMonth = currentYearMonth();

  const { data, error } = await supabase
    .from("line_image_usage")
    .select("count")
    .eq("trainer_id", trainerId)
    .eq("year_month", yearMonth)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = row not found（正常ケース）
    console.error("[line-usage] getImageCount error:", error.message);
  }

  return data?.count ?? 0;
}

/**
 * 警告・ブロック判定を行い、必要ならトレーナーへLINEプッシュ通知を送る。
 *
 * @param trainerId - トレーナーのUUID
 * @param count - 現在の送信数（incrementImageCount の戻り値を渡す）
 * @param trainerLineUserId - トレーナーの LINE ユーザーID（プッシュ先）
 * @param lineToken - LINE チャネルアクセストークン
 * @returns "ok" | "warn" | "blocked"
 */
export async function checkAndWarnIfNearLimit(
  trainerId: string,
  count: number,
  trainerLineUserId: string | null | undefined,
  lineToken?: string,
  clientLineUserId?: string,
): Promise<"ok" | "warn" | "blocked"> {
  // ソロテストモード: トレーナー通知もクライアントのLINEに送る
  const isSolo = process.env.SOLO_TEST_MODE === "true";
  const notifyTarget = isSolo
    ? (clientLineUserId ?? trainerLineUserId)
    : trainerLineUserId;
  const prefix = isSolo ? "【トレーナー通知】" : "";

  if (count >= BLOCK_THRESHOLD) {
    if (notifyTarget) {
      await pushMessage(
        notifyTarget,
        `${prefix}🚫 今月のLINE画像送信が上限（${BLOCK_THRESHOLD}枚）に達しました。来月まで画像送信は制限されます。`,
        lineToken
      ).catch((e) => console.error("[line-usage] push blocked warn error:", e));
    }
    return "blocked";
  }

  if (count >= WARN_THRESHOLD) {
    const remaining = BLOCK_THRESHOLD - count;
    if (notifyTarget) {
      await pushMessage(
        notifyTarget,
        `${prefix}⚠️ 今月のLINE画像送信が${count}枚を超えました。上限${BLOCK_THRESHOLD}枚まで残り${remaining}枚です。`,
        lineToken
      ).catch((e) => console.error("[line-usage] push warn error:", e));
    }
    return "warn";
  }

  return "ok";
}
