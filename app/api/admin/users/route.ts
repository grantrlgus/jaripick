import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = new Set(["super", "admin", "viewer"]);

// GET — 관리자 목록
//   super → 전체 / admin·viewer → 본인 단지만
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const sb = createServiceClient();
  let q = sb
    .from("admin_users")
    .select("id, email, name, role, complex, created_at")
    .order("created_at", { ascending: false });

  if (auth.admin.role !== "super") {
    if (!auth.admin.complex) {
      return NextResponse.json([]);
    }
    q = q.eq("complex", auth.admin.complex);
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST — 관리자 초대 (super 만)
// body: { email, name, role, complex }
//  - 이메일에 해당하는 auth.users 레코드가 이미 있어야 함 (Supabase Auth 1회 로그인 필요).
//  - role: super | admin | viewer
//  - complex: super 면 null 허용, 아니면 단지 slug 필수
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  if (auth.admin.role !== "super") {
    return NextResponse.json({ error: "슈퍼관리자만 초대 가능합니다" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });

  const email = String(body.email || "").trim().toLowerCase();
  const name = String(body.name || "").trim();
  const role = String(body.role || "admin").trim();
  const complex = body.complex ? String(body.complex).trim() : null;

  if (!email || !name) {
    return NextResponse.json({ error: "이메일/이름은 필수입니다" }, { status: 400 });
  }
  if (!ALLOWED_ROLES.has(role)) {
    return NextResponse.json({ error: "잘못된 role" }, { status: 400 });
  }
  if (role !== "super" && !complex) {
    return NextResponse.json({ error: "단지 slug 가 필요합니다" }, { status: 400 });
  }

  const sb = createServiceClient();

  // auth.users 에서 이메일 매칭. perPage 최대치로 검색.
  // 운영 규모가 커지면 RPC 로 리팩토링.
  let authUserId: string | null = null;
  let page = 1;
  for (;;) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const found = data.users.find((u) => (u.email || "").toLowerCase() === email);
    if (found) { authUserId = found.id; break; }
    if (data.users.length < 200) break;
    page += 1;
    if (page > 50) break; // 안전장치
  }

  if (!authUserId) {
    return NextResponse.json(
      { error: "해당 이메일의 사용자가 없습니다. 먼저 관리자 콘솔에 1회 로그인해야 합니다." },
      { status: 404 }
    );
  }

  // 이미 admin_users 에 있는지 확인.
  const { data: existing } = await sb
    .from("admin_users")
    .select("id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "이미 등록된 관리자입니다" }, { status: 409 });
  }

  const { data: inserted, error: insErr } = await sb
    .from("admin_users")
    .insert({ auth_user_id: authUserId, email, name, role, complex })
    .select("id, email, name, role, complex, created_at")
    .single();
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  return NextResponse.json(inserted, { status: 201 });
}
