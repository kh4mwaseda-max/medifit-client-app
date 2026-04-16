import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getTrainerId, verifyClientOwnership } from "@/lib/trainer-auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const trainerId = await getTrainerId();
  if (!trainerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: clientId } = await params;
  const { internal_memo } = await req.json();

  const ownership = await verifyClientOwnership(trainerId, clientId);
  if (!ownership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createServerClient();
  const { error } = await supabase
    .from("clients")
    .update({ internal_memo: internal_memo ?? null })
    .eq("id", clientId)
    .eq("trainer_id", trainerId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
