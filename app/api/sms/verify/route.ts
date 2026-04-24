import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 5;

function normalizePhone(raw: string): string {
  return raw.replace(/[^0-9]/g, "");
}

// POST { phone, code } → 검증
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const phone = normalizePhone(String(body?.phone || ""));
  const code = String(body?.code || "").trim();
  if (!phone || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  const sb = createServiceClient();
  const { data: row } = await sb
    .from("sms_otps")
    .select("id, code, expires_at, attempts, used")
    .eq("phone", phone)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row) {
    return NextResponse.json({ error: "인증번호를 먼저 요청해주세요" }, { status: 400 });
  }
  if (row.used) {
    return NextResponse.json({ error: "이미 사용된 인증번호입니다" }, { status: 400 });
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "인증번호가 만료되었어요. 재전송해주세요" }, { status: 400 });
  }
  if ((row.attempts ?? 0) >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: "시도 횟수를 초과했어요. 재전송해주세요" }, { status: 429 });
  }

  if (row.code !== code) {
    await sb.from("sms_otps").update({ attempts: (row.attempts ?? 0) + 1 }).eq("id", row.id);
    return NextResponse.json({ error: "인증번호가 일치하지 않아요" }, { status: 400 });
  }

  await sb.from("sms_otps").update({ used: true }).eq("id", row.id);
  return NextResponse.json({ ok: true });
}
