-- ============================================================
-- resident_requests 에 auth_user_id 컬럼 추가
-- ============================================================
-- 입주민 앱은 Supabase Auth (Google/Kakao) 로 로그인 → /api/residents/match 호출.
-- 이 컬럼으로 (auth.users → 승인된 dong/ho) 매핑을 서버에서 강제할 수 있게 됨.
--
-- 기존 행은 NULL 로 남기고, 신규 신청부터 채움.
-- /api/bids 등 보호된 endpoint 는 auth_user_id 가 있는 approved 행만 신뢰.

ALTER TABLE resident_requests
  ADD COLUMN IF NOT EXISTS auth_user_id UUID;

CREATE INDEX IF NOT EXISTS idx_resident_requests_auth_user
  ON resident_requests(auth_user_id);

-- 동일 (auth_user_id, complex) 의 approved 행은 1건만 허용 (중복 신청 방지).
-- partial unique index — pending/rejected 는 여러 개 허용.
CREATE UNIQUE INDEX IF NOT EXISTS uq_resident_requests_user_complex_approved
  ON resident_requests(auth_user_id, complex)
  WHERE status = 'approved' AND auth_user_id IS NOT NULL;

-- 확인:
-- SELECT auth_user_id, complex, dong, ho, name, status FROM resident_requests ORDER BY created_at DESC;
