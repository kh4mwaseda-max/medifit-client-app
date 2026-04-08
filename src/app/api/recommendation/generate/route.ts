import { NextRequest, NextResponse } from "next/server";
import { generateRecommendation, type PHRInput } from "@/lib/recommendation-engine";

export async function POST(req: NextRequest) {
  try {
    const { phrInput }: { phrInput: PHRInput } = await req.json();
    if (!phrInput) {
      return NextResponse.json({ error: "phrInput required" }, { status: 400 });
    }

    const recommendation = await generateRecommendation(phrInput);
    return NextResponse.json({ recommendation });
  } catch (err: any) {
    console.error("recommendation generate error:", err);
    return NextResponse.json({ error: err.message ?? "Unknown error" }, { status: 500 });
  }
}
