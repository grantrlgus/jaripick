-- ============================================================
-- complaints: 민원 / 문의
--   category 'complex'  → 단지 운영 (관리자가 답변)
--   category 'platform' → 앱/플랫폼 (자동 escalated, 본사 확인)
-- complaint_replies: 쓰레드 답변 (입주민 ↔ 관리자)
-- ============================================================

CREATE TABLE IF NOT EXISTS complaints (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  complex      TEXT        NOT NULL DEFAULT 'heliocity',
  dong         TEXT        NOT NULL,
  ho           TEXT        NOT NULL,
  author_name  TEXT        NOT NULL,
  phone        TEXT,
  category     TEXT        NOT NULL DEFAULT 'complex',  -- 'complex' | 'platform'
  title        TEXT        NOT NULL,
  body         TEXT        NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'open',      -- 'open' | 'in_progress' | 'done' | 'escalated'
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complaints_complex    ON complaints(complex);
CREATE INDEX IF NOT EXISTS idx_complaints_household  ON complaints(complex, dong, ho);
CREATE INDEX IF NOT EXISTS idx_complaints_status     ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category   ON complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_created    ON complaints(created_at DESC);

CREATE TABLE IF NOT EXISTS complaint_replies (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id  UUID        NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  author_role   TEXT        NOT NULL,  -- 'resident' | 'admin' | 'system'
  author_name   TEXT        NOT NULL,
  body          TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complaint_replies_parent ON complaint_replies(complaint_id, created_at);

ALTER TABLE complaints        ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_replies ENABLE ROW LEVEL SECURITY;
-- Service role만 R/W. anon/authenticated 정책 없음 (API 경유만).
