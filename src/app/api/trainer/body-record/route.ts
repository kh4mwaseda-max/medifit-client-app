import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { client_id, ...record } = body;

  if (!client_id) return NextResponse.json({ error: "client_id required" }, { status: 400 });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("body_records")
    .insert({ client_id, ...record })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ record: data });
}
