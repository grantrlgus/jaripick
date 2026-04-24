import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { sendSms, generateOtpCode } from "@/lib/sms";

export const dynamic = "force-dynamic";

const TTL_SECONDS = 180;          // 3분
const RATE_LIMIT_SECONDS = 30;    // 같은 번호 30초 내 재요청 차단

function normalizePhone(raw: string): string {
  return raw.replace(/[^0-9]/g, "");
}

// POST { phone } → 6자리 OTP 발송 + sms_otps 기록
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const phone = normalizePhone(String(body?.phone || ""));
  if (!/^010\d{7,8}$/.test(phone)) {
    return NextResponse.json({ error: "휴대폰 번호 형식이 올바르지 않아요" }, { status: 400 });
  }

  const sb = createServiceClient();

  // Rate limit: 최근 발송 시각 확인
  const { data: last } = await sb
    .from("sms_otps")
    .select("created_at")
    .eq("phone", phone)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (last) {
    const ago = (Date.now() - new Date(last.created_at).getTime()) / 1000;
    if (ago < RATE_LIMIT_SECONDS) {
      return NextResponse.json(
        { error: `${Math.ceil(RATE_LIMIT_SECONDS - ago)}초 후 다시 시도해주세요` },
        { status: 429 }
      );
    }
  }

  const code = generateOtpCode();
  const expires_at = new Date(Date.now() + TTL_SECONDS * 1000).toISOString();

  const { error: insErr } = await sb
    .from("sms_otps")
    .insert({ phone, code, expires_at });
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  const text = `[자리픽] 인증번호: ${code} (3분 내 입력)`;
  const r = await sendSms(phone, text);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 500 });

  return NextResponse.json({ ok: true, ttl: TTL_SECONDS });
}
