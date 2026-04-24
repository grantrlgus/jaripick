import { NextResponse } from "next/server";
import crypto from "crypto";
import { sendSms } from "@/lib/sms";

export const dynamic = "force-dynamic";

// Supabase "Send SMS Hook" 수신 endpoint.
// Supabase Auth → Phone OTP 발송 시 이 URL 로 POST 가 옴.
//   payload: { user: { phone, ... }, sms: { otp, ... } }
//   signed via Standard Webhooks (https://www.standardwebhooks.com/)
//
// 환경변수: SUPABASE_AUTH_SMS_HOOK_SECRET (Supabase Dashboard 에서 생성)
//   형식: "v1,whsec_<base64>"  → whsec_ 떼고 base64 decode 한 게 HMAC 키
//
// 발송: lib/sms.ts (SOLAPI). SOLAPI 미설정이면 콘솔 로그로 대체.

function verifySignature(
  rawBody: string,
  webhookId: string,
  webhookTimestamp: string,
  webhookSignature: string,
  secret: string
): boolean {
  // Strip "v1,whsec_" prefix and decode base64
  const cleaned = secret.replace(/^v1,/, "").replace(/^whsec_/, "");
  let key: Buffer;
  try {
    key = Buffer.from(cleaned, "base64");
  } catch {
    return false;
  }
  const signedPayload = `${webhookId}.${webhookTimestamp}.${rawBody}`;
  const expected = crypto
    .createHmac("sha256", key)
    .update(signedPayload)
    .digest("base64");
  // Header value can carry multiple comma-separated sigs: "v1,abc v1,def"
  const sigs = webhookSignature.split(" ").map((s) => s.replace(/^v1,/, ""));
  return sigs.some((s) => {
    try {
      return crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected));
    } catch {
      return false;
    }
  });
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const secret = process.env.SUPABASE_AUTH_SMS_HOOK_SECRET;

  // 시크릿이 설정되어 있으면 서명 검증 (운영). 없으면 검증 스킵 (개발/테스트).
  if (secret) {
    const wid = req.headers.get("webhook-id") || "";
    const wts = req.headers.get("webhook-timestamp") || "";
    const wsig = req.headers.get("webhook-signature") || "";
    if (!wid || !wts || !wsig) {
      return NextResponse.json({ error: "missing webhook headers" }, { status: 401 });
    }
    if (!verifySignature(rawBody, wid, wts, wsig, secret)) {
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
  }

  let payload: { user?: { phone?: string }; sms?: { otp?: string } };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const phone = payload.user?.phone || "";
  const otp = payload.sms?.otp || "";
  if (!phone || !otp) {
    return NextResponse.json({ error: "missing phone or otp" }, { status: 400 });
  }

  const text = `[자리픽] 인증번호: ${otp} (3분 내 입력)`;
  const r = await sendSms(phone, text);
  if (!r.ok) {
    return NextResponse.json({ error: r.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
