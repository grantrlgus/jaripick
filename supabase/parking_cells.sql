-- ============================================================
-- parking_cells: 관리자 레이아웃 에디터가 쓰는 주차 구역 테이블
-- 기존 프로덕션 DB에는 이미 존재할 수 있음 (IF NOT EXISTS 가드).
-- ============================================================

CREATE TABLE IF NOT EXISTS parking_cells (
  id         TEXT        PRIMARY KEY,
  n          TEXT        NOT NULL,
  "row"      TEXT        NOT NULL,
  lat        DOUBLE PRECISION NOT NULL,
  lng        DOUBLE PRECISION NOT NULL,
  rot        INTEGER     NOT NULL DEFAULT 0,
  type       TEXT        NOT NULL DEFAULT 'general',
  photo_url  TEXT,
  active     BOOLEAN     NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parking_cells_row ON parking_cells ("row");
CREATE INDEX IF NOT EXISTS idx_parking_cells_type ON parking_cells (type);

ALTER TABLE parking_cells ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 (입주민 앱이 익명으로 지도 조회)
DROP POLICY IF EXISTS "parking_cells_public_read" ON parking_cells;
CREATE POLICY "parking_cells_public_read" ON parking_cells
  FOR SELECT USING (true);

-- 쓰기는 service role만 (admin API 경유)
