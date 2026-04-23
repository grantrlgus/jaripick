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
    .from("notices")
    .select("*")
    .eq("complex", complex)
    .order("sent_at", { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST { complex?, target, title, body } — logs the notice (demo: no actual push).
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  if (!canWrite(auth.admin)) return NextResponse.json({ error: "쓰기 권한 없음" }, { status: 403 });
  const body = await req.json();
  const complex = body.complex || DEFAULT_COMPLEX;
  if (!canAccessComplex(auth.admin, complex)) return NextResponse.json({ error: "단지 접근 권한 없음" }, { status: 403 });
  const target = body.target || "all";
  const title = String(body.title || "").trim();
  const content = String(body.body || "").trim();
  if (!title || !content) {
    return NextResponse.json({ error: "제목과 본문을 입력해주세요" }, { status: 400 });
  }
  const sb = createServiceClient();

  // Count recipients (approved resident_requests)
  let recipient_count = 0;
  const { count } = await sb
    .from("resident_requests")
    .select("id", { count: "exact", head: true })
    .eq("complex", complex)
    .eq("status", "approved");
  recipient_count = count || 0;

  const { data, error } = await sb
    .from("notices")
    .insert({ complex, target, title, body: content, recipient_count })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  if (!canWrite(auth.admin)) return NextResponse.json({ error: "쓰기 권한 없음" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const sb = createServiceClient();
  const { error } = await sb.from("notices").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
