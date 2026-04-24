import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const DEFAULT_COMPLEX = "heliocity";

// Bearer 토큰이 있으면 auth.users id 를 추출 (없어도 OK — 익명 신청 호환).
async function resolveAuthUserId(req: Request): Promise<string | null> {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  if (!token) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  const c = createClient(url, anon, { auth: { persistSession: false } });
  const { data } = await c.auth.getUser(token);
  return data.user?.id ?? null;
}

// Input: { complex?, dong, ho, name, phone?, car_plate?, car_size?, ev? }
// Persists to resident_requests. Auto-approves if household roster matches.
// Bearer 가 있으면 auth_user_id 를 함께 저장 → 이후 /api/bids 등에서 신원 확인.
export async function POST(req: Request) {
  const authUserId = await resolveAuthUserId(req);
  const body = await req.json();
  const complex = body.complex || DEFAULT_COMPLEX;
  const dong = String(body.dong || "").trim();
  const ho = String(body.ho || "").trim();
  const name = String(body.name || "").trim();
  if (!dong || !ho || !name) {
    return NextResponse.json({ status: "invalid", reason: "동/호/이름 모두 입력해주세요" }, { status: 400 });
  }
  const sb = createServiceClient();

  // Look up roster
  const { data: household } = await sb
    .from("households")
    .select("*")
    .eq("complex", complex)
    .eq("dong", dong)
    .eq("ho", ho)
    .maybeSingle();

  let status: "approved" | "pending";
  let reason: string | null = null;
  let auto = false;

  if (!household) {
    status = "pending";
    reason = "명단에 없는 동·호";
  } else if (household.name !== name) {
    status = "pending";
    reason = "명단 실명 불일치";
  } else {
    status = "approved";
    auto = true;
  }

  const { data: reqRow, error: insErr } = await sb
    .from("resident_requests")
    .insert({
      complex,
      dong,
      ho,
      name,
      phone: body.phone ?? null,
      car_plate: body.car_plate ?? null,
      car_size: body.car_size ?? null,
      ev: !!body.ev,
      reason,
      status,
      auto,
      auth_user_id: authUserId,
      decided_at: status === "approved" ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  return NextResponse.json({
    status,
    request_id: reqRow.id,
    reason,
    household: household ? { dong: household.dong, ho: household.ho, name: household.name } : null,
  });
}
