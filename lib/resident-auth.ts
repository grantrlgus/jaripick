import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase";

export type ResidentIdentity = {
  auth_user_id: string;
  complex: string;
  dong: string;
  ho: string;
  name: string;
};

export type ResidentAuthResult =
  | { ok: true; resident: ResidentIdentity }
  | { ok: false; res: NextResponse };

// Authorization: Bearer <supabase-access-token> 헤더 → auth.users 검증 →
// resident_requests 의 approved 행으로 (complex, dong, ho, name) 매핑.
// complexHint 가 있으면 해당 단지의 approved 행을 우선 매칭.
export async function requireResident(
  req: Request,
  complexHint?: string | null
): Promise<ResidentAuthResult> {
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

  const sb = createServiceClient();
  let q = sb
    .from("resident_requests")
    .select("complex, dong, ho, name")
    .eq("auth_user_id", data.user.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(1);
  if (complexHint) q = q.eq("complex", complexHint);

  const { data: row } = await q.maybeSingle();
  if (!row) {
    return {
      ok: false,
      res: NextResponse.json(
        { error: "단지 입주민 승인이 필요해요" },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    resident: {
      auth_user_id: data.user.id,
      complex: row.complex,
      dong: row.dong,
      ho: row.ho,
      name: row.name,
    },
  };
}
