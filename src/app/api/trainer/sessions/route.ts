import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getTrainerId } from "@/lib/trainer-auth";

// GET: クライアントの予約一覧
export async function GET(req: NextRequest) {
  const trainerId = await getTrainerId();
  if (!trainerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = req.nextUrl.searchParams.get("client_id");
  const supabase = createServerClient();

  const query = supabase
    .from("scheduled_sessions")
    .select("*")
    .eq("trainer_id", trainerId)
    .order("scheduled_at", { ascending: true });

  if (clientId) query.eq("client_id", clientId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sessions: data });
}

// POST: 予約を追加
export async function POST(req: NextRequest) {
  const trainerId = await getTrainerId();
  if (!trainerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { client_id, scheduled_at, duration_min = 60, notes } = await req.json();
  if (!client_id || !scheduled_at) {
    return NextResponse.json({ error: "client_id と scheduled_at は必須です" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("scheduled_sessions")
    .insert({ trainer_id: trainerId, client_id, scheduled_at, duration_min, notes: notes || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session: data });
}

// PATCH: ステータス変更
export async function PATCH(req: NextRequest) {
  const trainerId = await getTrainerId();
  if (!trainerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, status } = await req.json();
  if (!id || !status) return NextResponse.json({ error: "id と status は必須です" }, { status: 400 });

  const supabase = createServerClient();
  const { error } = await supabase
    .from("scheduled_sessions")
    .update({ status })
    .eq("id", id)
    .eq("trainer_id", trainerId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE: 予約削除
export async function DELETE(req: NextRequest) {
  const trainerId = await getTrainerId();
  if (!trainerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id は必須です" }, { status: 400 });

  const supabase = createServerClient();
  const { error } = await supabase
    .from("scheduled_sessions")
    .delete()
    .eq("id", id)
    .eq("trainer_id", trainerId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
