import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = (file.type.split("/")[1] || "jpg").toLowerCase();
  const path = `${id}-${Date.now()}.${ext}`;

  const sb = createServiceClient();
  const { error: upErr } = await sb.storage
    .from("cell-photos")
    .upload(path, bytes, { contentType: file.type, upsert: true });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data: pub } = sb.storage.from("cell-photos").getPublicUrl(path);
  const photo_url = pub.publicUrl;

  const { error: updErr } = await sb
    .from("parking_cells")
    .update({ photo_url })
    .eq("id", id);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, photo_url });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const sb = createServiceClient();
  const { error } = await sb
    .from("parking_cells")
    .update({ photo_url: null })
    .eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
