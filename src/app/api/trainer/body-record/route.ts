import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getTrainerId, verifyClientOwnership } from "@/lib/trainer-auth";

export async function POST(req: NextRequest) {
  const trainerId = await getTrainerId();
  if (!trainerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { client_id, ...record } = body;

  if (!client_id) return NextResponse.json({ error: "client_id required" }, { status: 400 });

  const ownership = await verifyClientOwnership(trainerId, client_id);
  if (!ownership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("body_records")
    .insert({ client_id, ...record })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ record: data });
}
