import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { requireAdmin, canAccessComplex, canWrite } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const DEFAULT_COMPLEX = "heliocity";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const complex = url.searchParams.get("complex") || DEFAULT_COMPLEX;
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("households")
    .select("*")
    .eq("complex", complex)
    .order("dong")
    .order("ho");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// Bulk replace: { complex, rows: [{ dong, ho, name, phone?, status? }] }
export async function PUT(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  if (!canWrite(auth.admin)) return NextResponse.json({ error: "쓰기 권한 없음" }, { status: 403 });
  const body = await req.json();
  const complex = body.complex || DEFAULT_COMPLEX;
  if (!canAccessComplex(auth.admin, complex)) return NextResponse.json({ error: "단지 접근 권한 없음" }, { status: 403 });
  const rows = Array.isArray(body.rows) ? body.rows : null;
  if (!rows) return NextResponse.json({ error: "rows required" }, { status: 400 });
  const sb = createServiceClient();
  const { error: delErr } = await sb.from("households").delete().eq("complex", complex);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
  if (rows.length > 0) {
    const insert = rows.map((r: any) => ({
      complex,
      dong: String(r.dong),
      ho: String(r.ho),
      name: String(r.name),
      phone: r.phone ? String(r.phone) : null,
      status: r.status === "pending" ? "pending" : "approved",
    }));
    const { error } = await sb.from("households").insert(insert);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const rematched = await rematchPending(sb, complex);
  return NextResponse.json({ ok: true, count: rows.length, rematched });
}

// pending resident_requests에서 새 명단과 매치되는 건 자동 승인.
// Returns count of newly approved.
async function rematchPending(sb: ReturnType<typeof createServiceClient>, complex: string) {
  const { data: pendings } = await sb
    .from("resident_requests")
    .select("id, dong, ho, name")
    .eq("complex", complex)
    .eq("status", "pending");
  if (!pendings || pendings.length === 0) return 0;
  const { data: households } = await sb
    .from("households")
    .select("dong, ho, name")
    .eq("complex", complex);
  const roster = new Set((households || []).map((h) => `${h.dong}|${h.ho}|${h.name}`));
  const toApprove = pendings.filter((p) => roster.has(`${p.dong}|${p.ho}|${p.name}`));
  if (toApprove.length === 0) return 0;
  const ids = toApprove.map((p) => p.id);
  const { error } = await sb
    .from("resident_requests")
    .update({ status: "approved", auto: true, decided_at: new Date().toISOString(), reason: null })
    .in("id", ids);
  if (error) return 0;
  return toApprove.length;
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  if (!canWrite(auth.admin)) return NextResponse.json({ error: "쓰기 권한 없음" }, { status: 403 });
  const body = await req.json();
  const complex = body.complex || DEFAULT_COMPLEX;
  if (!canAccessComplex(auth.admin, complex)) return NextResponse.json({ error: "단지 접근 권한 없음" }, { status: 403 });
  if (!body.dong || !body.ho || !body.name) {
    return NextResponse.json({ error: "dong, ho, name required" }, { status: 400 });
  }
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("households")
    .insert({
      complex: body.complex || DEFAULT_COMPLEX,
      dong: String(body.dong),
      ho: String(body.ho),
      name: String(body.name),
      phone: body.phone ? String(body.phone) : null,
      status: body.status === "pending" ? "pending" : "approved",
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rematched = await rematchPending(sb, body.complex || DEFAULT_COMPLEX);
  return NextResponse.json({ ...data, rematched });
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  if (!canWrite(auth.admin)) return NextResponse.json({ error: "쓰기 권한 없음" }, { status: 403 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const sb = createServiceClient();
  const { error } = await sb.from("households").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
