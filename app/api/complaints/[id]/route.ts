import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { requireAdmin, canWrite, canAccessComplex } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// GET /api/complaints/:id → thread detail (complaint + replies)
//   Admin: requireAdmin + canAccessComplex
//   Resident: pass ?dong=&ho= matching the complaint's household
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const sb = createServiceClient();
  const { data: complaint, error: cErr } = await sb
    .from("complaints")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });
  if (!complaint) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const dong = searchParams.get("dong");
  const ho = searchParams.get("ho");
  const isResidentSelf = dong && ho && complaint.dong === dong && complaint.ho === ho;

  if (!isResidentSelf) {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;
    if (!canAccessComplex(auth.admin, complaint.complex)) {
      return NextResponse.json({ error: "단지 접근 권한 없음" }, { status: 403 });
    }
  }

  const { data: replies, error: rErr } = await sb
    .from("complaint_replies")
    .select("*")
    .eq("complaint_id", params.id)
    .order("created_at", { ascending: true });
  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 });

  return NextResponse.json({ complaint, replies: replies || [] });
}

// POST /api/complaints/:id/  → add reply.
//   body: { body, author_role?, author_name?, dong?, ho? }
//   - author_role='admin': requires admin auth
//   - author_role='resident': requires dong+ho matching the complaint
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const content = String(body.body || "").trim();
  if (!content) return NextResponse.json({ error: "답변 내용을 입력해주세요" }, { status: 400 });

  const sb = createServiceClient();
  const { data: complaint } = await sb
    .from("complaints")
    .select("id, complex, dong, ho, author_name, status, category")
    .eq("id", params.id)
    .maybeSingle();
  if (!complaint) return NextResponse.json({ error: "not found" }, { status: 404 });

  const role = body.author_role === "admin" ? "admin" : "resident";
  let authorName = "";

  if (role === "admin") {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;
    if (!canWrite(auth.admin)) return NextResponse.json({ error: "쓰기 권한 없음" }, { status: 403 });
    if (!canAccessComplex(auth.admin, complaint.complex)) {
      return NextResponse.json({ error: "단지 접근 권한 없음" }, { status: 403 });
    }
    authorName = auth.admin.name || auth.admin.email || "관리자";
  } else {
    const dong = String(body.dong || "").trim();
    const ho = String(body.ho || "").trim();
    if (!dong || !ho || dong !== complaint.dong || ho !== complaint.ho) {
      return NextResponse.json({ error: "본인 문의만 답변할 수 있어요" }, { status: 403 });
    }
    authorName = String(body.author_name || complaint.author_name || "").trim() || "입주민";
  }

  const { data: reply, error } = await sb
    .from("complaint_replies")
    .insert({ complaint_id: params.id, author_role: role, author_name: authorName, body: content })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 관리자 답변이면 status가 open이었을 때 in_progress로
  if (role === "admin" && complaint.status === "open") {
    await sb.from("complaints").update({ status: "in_progress", updated_at: new Date().toISOString() }).eq("id", params.id);
  } else {
    await sb.from("complaints").update({ updated_at: new Date().toISOString() }).eq("id", params.id);
  }

  return NextResponse.json(reply);
}

// PATCH /api/complaints/:id  { status }  (admin)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  if (!canWrite(auth.admin)) return NextResponse.json({ error: "쓰기 권한 없음" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const status = body.status;
  if (!["open", "in_progress", "done", "escalated"].includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }
  const sb = createServiceClient();
  const { data: complaint } = await sb
    .from("complaints")
    .select("complex")
    .eq("id", params.id)
    .maybeSingle();
  if (!complaint) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!canAccessComplex(auth.admin, complaint.complex)) {
    return NextResponse.json({ error: "단지 접근 권한 없음" }, { status: 403 });
  }
  const { error } = await sb
    .from("complaints")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
