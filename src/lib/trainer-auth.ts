import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase";
import { createHash } from "crypto";
import { randomBytes } from "crypto";

export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

/** 安全なセッショントークンを生成（32バイト = 64文字hex） */
export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

/** Cookie からトレーナーIDを取得。DBのセッションレコードを検証する。 */
export async function getTrainerId(): Promise<string | null> {
  const cookieStore = await cookies();
  const trainerId = cookieStore.get("trainer_id")?.value;
  const sessionToken = cookieStore.get("trainer_session")?.value;

  if (!trainerId || !sessionToken) return null;

  const supabase = createServerClient();
  const { data } = await supabase
    .from("trainer_sessions")
    .select("trainer_id, expires_at")
    .eq("session_token", sessionToken)
    .eq("trainer_id", trainerId)
    .single();

  if (!data || new Date(data.expires_at) < new Date()) return null;
  return data.trainer_id;
}

/** セッションをDBに保存し、Cookie をセット */
export async function createSession(res: Response, trainerId: string): Promise<void> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30日

  const supabase = createServerClient();
  await supabase.from("trainer_sessions").insert({
    trainer_id: trainerId,
    session_token: token,
    expires_at: expiresAt.toISOString(),
  });

  (res as any).cookies?.set("trainer_id", trainerId, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  (res as any).cookies?.set("trainer_session", token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
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

/** クライアントが指定トレーナーに属するか検証。属さない場合は null を返す */
export async function verifyClientOwnership(trainerId: string, clientId: string) {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("clients")
    .select("id, trainer_id")
    .eq("id", clientId)
    .eq("trainer_id", trainerId)
    .single();
  return data;
}
