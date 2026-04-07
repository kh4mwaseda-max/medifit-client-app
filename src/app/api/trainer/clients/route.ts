import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

const TRAINER_ID = process.env.TRAINER_ID!;

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, goal, start_date, created_at")
    .eq("trainer_id", TRAINER_ID)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ clients: data });
}

export async function POST(req: NextRequest) {
  const { name, pin, goal, start_date } = await req.json();

  if (!name || !pin) {
    return NextResponse.json({ error: "name and pin are required" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({ trainer_id: TRAINER_ID, name, pin, goal: goal || null, start_date: start_date || new Date().toISOString().split("T")[0] })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ client: data });
}
