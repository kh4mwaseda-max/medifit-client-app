import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getTrainerId } from "@/lib/trainer-auth";

export async function GET() {
  const trainerId = await getTrainerId();
  if (!trainerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServerClient();
  const { data } = await supabase
    .from("trainers")
    .select("id, name, email, plan, line_channel_access_token, line_channel_secret, line_notify_user_id")
    .eq("id", trainerId)
    .single();

  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // トークンは伏せて返す（設定済みかどうかだけ分かればいい）
  return NextResponse.json({
    trainer: {
      ...data,
      line_channel_access_token: data.line_channel_access_token ? "***set***" : null,
      line_channel_secret: data.line_channel_secret ? "***set***" : null,
    },
    webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/line/webhook/${trainerId}`,
  });
}

export async function POST(req: NextRequest) {
  const trainerId = await getTrainerId();
  if (!trainerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, line_channel_access_token, line_channel_secret, line_notify_user_id } = await req.json();

  const updates: Record<string, string> = { updated_at: new Date().toISOString() };
  if (name) updates.name = name;
  if (line_channel_access_token && line_channel_access_token !== "***set***")
    updates.line_channel_access_token = line_channel_access_token;
  if (line_channel_secret && line_channel_secret !== "***set***")
    updates.line_channel_secret = line_channel_secret;
  if (line_notify_user_id !== undefined) updates.line_notify_user_id = line_notify_user_id;

  const supabase = createServerClient();
  const { error } = await supabase
    .from("trainers")
    .update(updates)
    .eq("id", trainerId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
