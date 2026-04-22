import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { authorizePhotoAccess } from "@/lib/photo-auth";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const BUCKET = "body-photos";
const MAX_BYTES = 8 * 1024 * 1024; // 8MB（ブラウザ側で1200pxにリサイズ済み想定）
const SIGNED_URL_TTL = 60 * 60 * 24; // 24h

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const clientId = String(form.get("clientId") ?? "");
  const file = form.get("file");
  const weightRaw = form.get("weight_kg");

  if (!clientId || !(file instanceof Blob)) {
    return NextResponse.json({ error: "clientId and file required" }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "ファイルサイズが不正です（最大8MB）" }, { status: 413 });
  }
  const contentType = file.type || "image/jpeg";
  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "画像ファイルを指定してください" }, { status: 400 });
  }

  const auth = await authorizePhotoAccess(clientId);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const ext = contentType === "image/png" ? "png" : "jpg";
  const path = `${clientId}/${randomUUID()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const supabase = createServerClient();
  const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(path, buf, {
    contentType,
    upsert: false,
  });
  if (uploadErr) {
    return NextResponse.json({ error: `アップロードに失敗しました: ${uploadErr.message}` }, { status: 500 });
  }

  const today = new Date().toISOString().split("T")[0];
  const weight_kg = weightRaw && String(weightRaw).trim() !== "" ? Number(weightRaw) : null;

  const { data: row, error: insertErr } = await supabase
    .from("body_photos")
    .insert({
      client_id: clientId,
      photo_date: today,
      // DBの `not null` 制約と既存 check ('front'|'back'|'side') を満たすため常に 'front' で登録。
      // PhotoComparison は pose を使わず全写真を時系列で並べるだけなので、UIへの影響なし。
      pose: "front",
      storage_path: path,
      weight_kg: Number.isFinite(weight_kg as number) ? weight_kg : null,
    })
    .select("*")
    .single();

  if (insertErr || !row) {
    await supabase.storage.from(BUCKET).remove([path]);
    return NextResponse.json({ error: insertErr?.message ?? "DB登録に失敗しました" }, { status: 500 });
  }

  const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL);

  return NextResponse.json({
    photo: { ...row, signed_url: signed?.signedUrl ?? null },
  });
}
