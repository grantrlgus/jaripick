import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { requireAdmin, canWrite, canAccessComplex } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const DEFAULT_COMPLEX = "heliocity";

// GET ?complex=&status=pending|approved|rejected|all  (admin only)
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { searchParams } = new URL(req.url);
  const complex = searchParams.get("complex") || DEFAULT_COMPLEX;
  if (!canAccessComplex(auth.admin, complex)) return NextResponse.json({ error: "단지 접근 권한 없음" }, { status: 403 });
  const status = searchParams.get("status") || "all";
  const sb = createServiceClient();
  let q = sb
    .from("resident_requests")
    .select("*")
    .eq("complex", complex)
    .order("created_at", { ascending: false });
  if (status !== "all") q = q.eq("status", status);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// GET by id (for resident app polling) — use PATCH for state change
// PATCH /api/residents/requests?id=xxx  { status: 'approved' | 'rejected' }  (admin only)
export async function PATCH(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  if (!canWrite(auth.admin)) return NextResponse.json({ error: "쓰기 권한 없음" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const body = await req.json();
  const status = body.status;
  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }
  const sb = createServiceClient();
  const { error } = await sb
    .from("resident_requests")
    .update({ status, decided_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
