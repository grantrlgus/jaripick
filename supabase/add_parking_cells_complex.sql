-- ============================================================
-- parking_cells 에 complex 컬럼 추가 (다단지 지원)
-- ============================================================
-- 기존 행은 모두 'heliocity' 로 백필.
-- 향후 다른 단지 셀은 (complex='<slug>') 로 등록.

ALTER TABLE parking_cells
  ADD COLUMN IF NOT EXISTS complex TEXT NOT NULL DEFAULT 'heliocity';

CREATE INDEX IF NOT EXISTS idx_parking_cells_complex ON parking_cells(complex);

-- 같은 단지 내에서 셀 번호(n) 유일성 (선택 — 운영 정책에 맞게)
-- CREATE UNIQUE INDEX IF NOT EXISTS uq_parking_cells_complex_n
--   ON parking_cells(complex, n);

-- 확인:
-- SELECT complex, count(*) FROM parking_cells GROUP BY complex;
