import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("parking_cells")
    .select("*")
    .order("n");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

export async function PUT(req: Request) {
  const cells = await req.json();
  if (!Array.isArray(cells)) {
    return NextResponse.json({ error: "cells must be an array" }, { status: 400 });
  }
  const sb = createServiceClient();
  // Preserve existing photo_url across layout re-saves.
  const { data: existing } = await sb.from("parking_cells").select("id, photo_url");
  const photoById = new Map<string, string | null>(
    (existing ?? []).map((r) => [r.id, r.photo_url ?? null])
  );
  const { error: delError } = await sb.from("parking_cells").delete().neq("id", "");
  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });
  if (cells.length > 0) {
    const rows = cells.map((c: any) => ({
      id: String(c.id),
      n: String(c.n),
      row: String(c.row),
      lat: Number(c.lat),
      lng: Number(c.lng),
      rot: Number(c.rot ?? 0),
      type: String(c.type ?? "general"),
      photo_url: c.photo_url ?? photoById.get(String(c.id)) ?? null,
    }));
    const { error } = await sb.from("parking_cells").insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, count: cells.length });
}
