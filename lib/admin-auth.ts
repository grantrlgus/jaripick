import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase";

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: "super" | "admin" | "viewer";
  complex: string | null;
};

export type AdminAuthResult =
  | { ok: true; admin: AdminUser }
  | { ok: false; res: NextResponse };

// API routes에서 사용. Authorization: Bearer <access_token> 헤더 검증 후
// admin_users 테이블에서 해당 유저를 조회해 반환.
export async function requireAdmin(req: Request): Promise<AdminAuthResult> {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return { ok: false, res: NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 }) };
  }
  const token = header.slice(7).trim();
  if (!token) {
    return { ok: false, res: NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 }) };
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return { ok: false, res: NextResponse.json({ error: "auth 미설정" }, { status: 500 }) };
  }
  const anonClient = createClient(url, anon, { auth: { persistSession: false } });
  const { data, error } = await anonClient.auth.getUser(token);
  if (error || !data.user) {
    return { ok: false, res: NextResponse.json({ error: "세션이 만료되었어요" }, { status: 401 }) };
  }
  const service = createServiceClient();
  const { data: admin } = await service
    .from("admin_users")
    .select("id, email, name, role, complex")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();
  if (!admin) {
    return { ok: false, res: NextResponse.json({ error: "관리자 권한이 없어요" }, { status: 403 }) };
  }
  return { ok: true, admin: admin as AdminUser };
}

// 단지 스코프 체크. super는 모든 단지 허용, 그 외는 본인 단지만.
export function canAccessComplex(admin: AdminUser, complex: string): boolean {
  if (admin.role === "super") return true;
  return admin.complex === complex;
}

// 쓰기 권한 체크 (viewer 차단).
export function canWrite(admin: AdminUser): boolean {
  return admin.role === "super" || admin.role === "admin";
}
