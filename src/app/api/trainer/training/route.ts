import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getTrainerId, verifyClientOwnership } from "@/lib/trainer-auth";

export async function POST(req: NextRequest) {
  const trainerId = await getTrainerId();
  if (!trainerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { client_id, session_date, notes, sets } = await req.json();

  if (!client_id || !session_date) {
    return NextResponse.json({ error: "client_id and session_date required" }, { status: 400 });
  }

  const ownership = await verifyClientOwnership(trainerId, client_id);
  if (!ownership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
