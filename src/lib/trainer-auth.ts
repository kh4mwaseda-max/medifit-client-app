import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase";
import { createHash } from "crypto";

export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

/** Cookie から trainer_id を取得（未認証なら null） */
export async function getTrainerId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("trainer_id")?.value ?? null;
}

/** trainer_id を Cookie にセット */
export function setTrainerCookie(res: Response, trainerId: string) {
  (res.headers as any).append(
    "Set-Cookie",
    `trainer_id=${trainerId}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 30}`
  );
}

/** DBからトレーナー情報を取得（認証済み前提） */
export async function getTrainer(trainerId: string) {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("trainers")
    .select("id, name, email, plan, line_channel_access_token, line_channel_secret, line_notify_user_id")
    .eq("id", trainerId)
    .single();
  return data;
}
