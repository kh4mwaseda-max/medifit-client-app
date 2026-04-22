import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { authorizePhotoAccess } from "@/lib/photo-auth";

const BUCKET = "body-photos";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ photoId: string }> },
) {
  const { photoId } = await params;
  const supabase = createServerClient();

  const { data: photo } = await supabase
    .from("body_photos")
    .select("id, client_id, storage_path")
    .eq("id", photoId)
    .single();

  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const auth = await authorizePhotoAccess(photo.client_id);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  await supabase.storage.from(BUCKET).remove([photo.storage_path]);
  const { error } = await supabase.from("body_photos").delete().eq("id", photoId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
