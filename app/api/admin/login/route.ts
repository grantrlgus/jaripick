import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// POST { email, password } → { access_token, refresh_token, admin }
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim();
  const password = String(body.password || "");
  if (!email || !password) {
    return NextResponse.json({ error: "이메일과 비밀번호를 입력해주세요" }, { status: 400 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json({ error: "auth 미설정" }, { status: 500 });
  }
  const sb = createClient(url, anon, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    return NextResponse.json({ error: "이메일 또는 비밀번호가 올바르지 않아요" }, { status: 401 });
  }
  const service = createServiceClient();
  const { data: admin } = await service
    .from("admin_users")
    .select("id, email, name, role, complex")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();
  if (!admin) {
    return NextResponse.json({ error: "관리자 권한이 없는 계정이에요" }, { status: 403 });
  }
  return NextResponse.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
    admin,
  });
}
