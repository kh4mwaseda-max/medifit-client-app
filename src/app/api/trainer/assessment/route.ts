import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function PATCH(req: NextRequest) {
  const { assessmentId, publish } = await req.json();

  if (!assessmentId) return NextResponse.json({ error: "assessmentId required" }, { status: 400 });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("assessments")
    .update({ published_at: publish ? new Date().toISOString() : null })
    .eq("id", assessmentId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ assessment: data });
}
