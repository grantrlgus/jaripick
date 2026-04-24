import crypto from "crypto";

// SOLAPI (구 Coolsms) HTTP API 직접 호출.
// 환경변수:
//   SOLAPI_API_KEY
//   SOLAPI_API_SECRET
//   SOLAPI_SENDER_PHONE  (사전 등록된 발신번호, 010-xxxx-xxxx 형식)
//   SOLAPI_DEV_MODE=1    (true 면 실제 발송 대신 콘솔 로그)

const ENDPOINT = "https://api.solapi.com/messages/v4/send";

function buildAuthHeader(apiKey: string, apiSecret: string): string {
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(16).toString("hex");
  const signature = crypto
    .createHmac("sha256", apiSecret)
    .update(date + salt)
    .digest("hex");
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

export type SmsResult = { ok: true } | { ok: false; error: string };

export async function sendSms(to: string, text: string): Promise<SmsResult> {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const from = process.env.SOLAPI_SENDER_PHONE;

  // 개발/스테이징: 콘솔 출력으로 대체 (실제 SMS 비용 발생 방지).
  if (process.env.SOLAPI_DEV_MODE === "1" || !apiKey || !apiSecret || !from) {
    // eslint-disable-next-line no-console
    console.log(`[SMS DEV] to=${to} text=${text}`);
    return { ok: true };
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: buildAuthHeader(apiKey, apiSecret),
      },
      body: JSON.stringify({
        message: { to: to.replace(/-/g, ""), from: from.replace(/-/g, ""), text },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `SOLAPI ${res.status}: ${body.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "SMS 발송 실패" };
  }
}

// 6자리 OTP 코드 생성
export function generateOtpCode(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}
