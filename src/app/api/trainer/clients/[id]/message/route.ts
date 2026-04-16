import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getTrainerId } from "@/lib/trainer-auth";
import { pushMessage } from "@/lib/line";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const trainerId = await getTrainerId();
  if (!trainerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: clientId } = await params;
  const { message } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "message is required" }, { status: 400 });

  const supabase = createServerClient();

  // クライアントがこのトレーナーのものか確認
  const { data: client } = await supabase
    .from("clients")
    .select("id, name, line_user_id")
    .eq("id", clientId)
    .eq("trainer_id", trainerId)
    .single();

  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  if (!client.line_user_id) return NextResponse.json({ error: "LINE未連携のクライアントです" }, { status: 400 });

  await pushMessage(client.line_user_id, message.trim());

  return NextResponse.json({ ok: true });
}
