import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { requireAdmin, canWrite } from "@/lib/admin-auth";

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
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  if (!canWrite(auth.admin)) return NextResponse.json({ error: "쓰기 권한 없음" }, { status: 403 });
  const cells = await req.json();
  if (!Array.isArray(cells)) {
    return NextResponse.json({ error: "cells must be an array" }, { status: 400 });
  }
  const sb = createServiceClient();
  // Preserve existing photo_url + active across layout re-saves.
  const { data: existing } = await sb.from("parking_cells").select("id, photo_url, active");
  const existingById = new Map<string, { photo_url: string | null; active: boolean }>(
    (existing ?? []).map((r) => [r.id, { photo_url: r.photo_url ?? null, active: r.active ?? true }])
  );
  const { error: delError } = await sb.from("parking_cells").delete().neq("id", "");
  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });
  if (cells.length > 0) {
    const rows = cells.map((c: any) => {
      const prev = existingById.get(String(c.id));
      return {
        id: String(c.id),
        n: String(c.n),
        row: String(c.row),
        lat: Number(c.lat),
        lng: Number(c.lng),
        rot: Number(c.rot ?? 0),
        type: String(c.type ?? "general"),
        photo_url: c.photo_url ?? prev?.photo_url ?? null,
        active: typeof c.active === "boolean" ? c.active : prev?.active ?? true,
      };
    });
    const { error } = await sb.from("parking_cells").insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, count: cells.length });
}
