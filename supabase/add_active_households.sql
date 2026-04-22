-- ============================================================
-- 1) parking_cells.active (활성/비활성 토글)
-- 2) households 테이블 (입주민 명단)
-- 3) 오금현대 seed (황기현 포함)
-- ============================================================

ALTER TABLE parking_cells
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS households (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  complex    TEXT        NOT NULL DEFAULT 'heliocity',
  dong       TEXT        NOT NULL,
  ho         TEXT        NOT NULL,
  name       TEXT        NOT NULL,
  phone      TEXT,
  status     TEXT        NOT NULL DEFAULT 'approved', -- approved | pending
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (complex, dong, ho)
);

CREATE INDEX IF NOT EXISTS idx_households_complex ON households(complex);
CREATE INDEX IF NOT EXISTS idx_households_name ON households(name);

ALTER TABLE households ENABLE ROW LEVEL SECURITY;
-- Service role은 RLS 우회, 공개 읽기 허용 안 함 (개인정보)

-- Seed 입주민 명단 (오금현대)
INSERT INTO households (complex, dong, ho, name, phone, status) VALUES
  ('heliocity', '101', '101',  '황기현', '010-7651-9051', 'approved'),
  ('heliocity', '101', '1201', '김철수', '010-1234-5678', 'approved'),
  ('heliocity', '101', '0802', '정수민', '010-2222-3333', 'approved'),
  ('heliocity', '102', '0804', '최민석', '010-3333-4444', 'approved'),
  ('heliocity', '103', '0902', '이영희', '010-4444-5555', 'approved'),
  ('heliocity', '103', '1505', '장현진', '010-5555-6666', 'approved'),
  ('heliocity', '104', '2101', '조현우', '010-6666-7777', 'approved'),
  ('heliocity', '105', '1503', '박지민', '010-7777-8888', 'approved'),
  ('heliocity', '105', '0503', '박민수', '010-8888-9999', 'approved'),
  ('heliocity', '106', '0301', '한예슬', '010-9999-0000', 'approved'),
  ('heliocity', '107', '0701', '윤서준', '010-1111-2222', 'approved'),
  ('heliocity', '108', '1802', '강다인', '010-0000-1111', 'approved')
ON CONFLICT (complex, dong, ho) DO UPDATE
  SET name = EXCLUDED.name, phone = EXCLUDED.phone, status = EXCLUDED.status;
