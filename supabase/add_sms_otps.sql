-- ============================================================
-- sms_otps: 휴대폰 본인인증 OTP 저장소
-- ============================================================
-- /api/sms/send 발송 시 행 1건 생성, /api/sms/verify 통과 시 used=true.
-- 만료된 행은 청소 함수로 정리 (선택).

CREATE TABLE IF NOT EXISTS sms_otps (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       TEXT        NOT NULL,
  code        TEXT        NOT NULL,           -- 6자리 평문 (3분 만료라 단순화)
  expires_at  TIMESTAMPTZ NOT NULL,
  attempts    INTEGER     NOT NULL DEFAULT 0,
  used        BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sms_otps_phone_created
  ON sms_otps(phone, created_at DESC);

-- 만료된 OTP 청소 (선택; cron 으로 호출):
--   DELETE FROM sms_otps WHERE expires_at < now() - INTERVAL '1 day';
