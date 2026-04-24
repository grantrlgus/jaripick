import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { requireAdmin, canWrite, canAccessComplex } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const DEFAULT_COMPLEX = "heliocity";

// GET ?complex=heliocity — 공개. 입주민 앱 지도에 사용.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const complex = searchParams.get("complex") || DEFAULT_COMPLEX;
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("parking_cells")
    .select("*")
    .eq("complex", complex)
    .order("n");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

// PUT ?complex=heliocity  body: cells[] — 해당 단지 셀 전체 교체
export async function PUT(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  if (!canWrite(auth.admin)) return NextResponse.json({ error: "쓰기 권한 없음" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const complex = searchParams.get("complex") || DEFAULT_COMPLEX;
  if (!canAccessComplex(auth.admin, complex)) {
    return NextResponse.json({ error: "단지 접근 권한 없음" }, { status: 403 });
  }
  const cells = await req.json();
  if (!Array.isArray(cells)) {
    return NextResponse.json({ error: "cells must be an array" }, { status: 400 });
  }
  const sb = createServiceClient();
  // Preserve existing photo_url + active across layout re-saves (해당 단지 한정).
  const { data: existing } = await sb
    .from("parking_cells")
    .select("id, photo_url, active")
    .eq("complex", complex);
  const existingById = new Map<string, { photo_url: string | null; active: boolean }>(
    (existing ?? []).map((r) => [r.id, { photo_url: r.photo_url ?? null, active: r.active ?? true }])
  );
  // 해당 단지 셀만 삭제 (다른 단지 영향 X).
  const { error: delError } = await sb
    .from("parking_cells")
    .delete()
    .eq("complex", complex);
  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });
  if (cells.length > 0) {
    const rows = cells.map((c: any) => {
      const prev = existingById.get(String(c.id));
      return {
        id: String(c.id),
        complex,
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
