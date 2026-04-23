import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { requireAdmin, canAccessComplex } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const DEFAULT_COMPLEX = "heliocity";

// GET modes:
//   1) Admin list:     GET ?complex=&status=&category=   (requires admin)
//   2) Resident list:  GET ?complex=&dong=&ho=           (public — own complaints only)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const complex = searchParams.get("complex") || DEFAULT_COMPLEX;
  const dong = searchParams.get("dong");
  const ho = searchParams.get("ho");
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const sb = createServiceClient();

  // Resident mode: dong + ho required, no admin check
  if (dong && ho) {
    const { data, error } = await sb
      .from("complaints")
      .select("*")
      .eq("complex", complex)
      .eq("dong", dong)
      .eq("ho", ho)
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  }

  // Admin mode
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  if (!canAccessComplex(auth.admin, complex)) {
    return NextResponse.json({ error: "단지 접근 권한 없음" }, { status: 403 });
  }
  let q = sb.from("complaints").select("*").eq("complex", complex).order("created_at", { ascending: false });
  if (status && status !== "all") q = q.eq("status", status);
  if (category && category !== "all") q = q.eq("category", category);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST create — resident endpoint (no admin auth).
// { complex?, dong, ho, author_name, phone?, category, title, body }
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const complex = String(body.complex || DEFAULT_COMPLEX);
  const dong = String(body.dong || "").trim();
  const ho = String(body.ho || "").trim();
  const author_name = String(body.author_name || "").trim();
  const phone = body.phone ? String(body.phone) : null;
  const category = body.category === "platform" ? "platform" : "complex";
  const title = String(body.title || "").trim();
  const content = String(body.body || "").trim();
  if (!dong || !ho || !author_name || !title || !content) {
    return NextResponse.json({ error: "동/호/이름/제목/본문 필수" }, { status: 400 });
  }
  const sb = createServiceClient();
  const initialStatus = category === "platform" ? "escalated" : "open";
  const { data, error } = await sb
    .from("complaints")
    .insert({ complex, dong, ho, author_name, phone, category, title, body: content, status: initialStatus })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Platform 카테고리는 자동으로 system 메모 추가 (본사 에스컬레이션 기록)
  if (category === "platform" && data) {
    await sb.from("complaint_replies").insert({
      complaint_id: data.id,
      author_role: "system",
      author_name: "자리픽",
      body: "앱/플랫폼 관련 문의는 자리픽 운영팀에 자동으로 전달되었어요. 담당자가 확인 후 연락드릴게요.",
    });
  }
  return NextResponse.json(data);
}
