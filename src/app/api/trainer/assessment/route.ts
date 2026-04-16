import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getTrainerId } from "@/lib/trainer-auth";

export async function PATCH(req: NextRequest) {
  const trainerId = await getTrainerId();
  if (!trainerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { assessmentId, publish } = await req.json();

  if (!assessmentId) return NextResponse.json({ error: "assessmentId required" }, { status: 400 });

  const supabase = createServerClient();

  // Verify trainer owns this assessment via client relationship
  const { data: existing } = await supabase
    .from("assessments")
    .select("id, client_id, clients!inner(trainer_id)")
    .eq("id", assessmentId)
    .single();

  if (!existing || (existing.clients as any)?.trainer_id !== trainerId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("assessments")
    .update({ published_at: publish ? new Date().toISOString() : null })
    .eq("id", assessmentId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ assessment: data });
}
