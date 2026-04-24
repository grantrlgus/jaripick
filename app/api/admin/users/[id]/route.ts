import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = new Set(["super", "admin", "viewer"]);

// PATCH — 역할/단지 수정 (super 만)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  if (auth.admin.role !== "super") {
    return NextResponse.json({ error: "슈퍼관리자만 수정 가능합니다" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });

  const update: { role?: string; complex?: string | null; name?: string } = {};
  if (typeof body.role === "string") {
    if (!ALLOWED_ROLES.has(body.role)) {
      return NextResponse.json({ error: "잘못된 role" }, { status: 400 });
    }
    update.role = body.role;
  }
  if ("complex" in body) {
    update.complex = body.complex ? String(body.complex).trim() : null;
  }
  if (typeof body.name === "string") {
    update.name = body.name.trim();
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "변경할 내용이 없습니다" }, { status: 400 });
  }

  const sb = createServiceClient();
  const { data, error } = await sb
    .from("admin_users")
    .update(update)
    .eq("id", params.id)
    .select("id, email, name, role, complex, created_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE — 관리자 삭제 (super 만, 본인 제외)
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  if (auth.admin.role !== "super") {
    return NextResponse.json({ error: "슈퍼관리자만 삭제 가능합니다" }, { status: 403 });
  }
  if (params.id === auth.admin.id) {
    return NextResponse.json({ error: "본인 계정은 삭제할 수 없습니다" }, { status: 400 });
  }

  const sb = createServiceClient();
  const { error } = await sb.from("admin_users").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
