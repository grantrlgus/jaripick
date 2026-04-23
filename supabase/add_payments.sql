-- ============================================================
-- payments: 낙찰자 월별 분납 스케줄
-- 라운드 finalize 시 auto-populate. 관리자가 status 토글.
-- ============================================================

CREATE TABLE IF NOT EXISTS payments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  complex     TEXT        NOT NULL DEFAULT 'heliocity',
  round_id    UUID        NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  cell_id     TEXT        NOT NULL,
  dong        TEXT        NOT NULL,
  ho          TEXT        NOT NULL,
  name        TEXT        NOT NULL,
  period      TEXT        NOT NULL,       -- 'YYYY-MM'
  amount      INTEGER     NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'pending',  -- pending / paid / overdue / refunded
  due_date    DATE        NOT NULL,
  paid_at     TIMESTAMPTZ,
  memo        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (round_id, cell_id, dong, ho, period)
);

CREATE INDEX IF NOT EXISTS idx_payments_complex    ON payments(complex);
CREATE INDEX IF NOT EXISTS idx_payments_round      ON payments(round_id);
CREATE INDEX IF NOT EXISTS idx_payments_household  ON payments(complex, dong, ho);
CREATE INDEX IF NOT EXISTS idx_payments_status     ON payments(status);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
-- Service role만 R/W. RLS 공개 정책 없음 (개인 결제정보).
