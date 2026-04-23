import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { requireAdmin, canWrite, canAccessComplex } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const DEFAULT_COMPLEX = "heliocity";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const complex = searchParams.get("complex") || DEFAULT_COMPLEX;
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("complex_config")
    .select("*")
    .eq("complex", complex)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || { complex });
}

export async function PUT(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  if (!canWrite(auth.admin)) return NextResponse.json({ error: "쓰기 권한 없음" }, { status: 403 });
  const body = await req.json();
  const complex = body.complex || DEFAULT_COMPLEX;
  if (!canAccessComplex(auth.admin, complex)) return NextResponse.json({ error: "단지 접근 권한 없음" }, { status: 403 });
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const k of ["name", "address", "total_units", "min_bid", "bid_rule", "payment_mode"] as const) {
    if (body[k] !== undefined) patch[k] = body[k];
  }
  const sb = createServiceClient();
  const { error } = await sb
    .from("complex_config")
    .upsert({ complex, ...patch }, { onConflict: "complex" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
