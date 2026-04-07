import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { client_id, session_date, notes, sets } = await req.json();

  if (!client_id || !session_date) {
    return NextResponse.json({ error: "client_id and session_date required" }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data: session, error: sessionError } = await supabase
    .from("training_sessions")
    .insert({ client_id, session_date, notes })
    .select()
    .single();

  if (sessionError) return NextResponse.json({ error: sessionError.message }, { status: 500 });

  if (sets && sets.length > 0) {
    const { error: setsError } = await supabase
      .from("training_sets")
      .insert(sets.map((s: any) => ({ ...s, session_id: session.id })));

    if (setsError) return NextResponse.json({ error: setsError.message }, { status: 500 });
  }

  return NextResponse.json({ session });
}
