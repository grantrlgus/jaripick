-- ============================================================
-- admin_users: 관리자 계정
-- Supabase Auth (auth.users) 와 1:1 매핑. role 기반 권한 체크.
-- ============================================================

CREATE TABLE IF NOT EXISTS admin_users (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT        NOT NULL UNIQUE,
  name         TEXT        NOT NULL,
  role         TEXT        NOT NULL DEFAULT 'admin',  -- super / admin / viewer
  complex      TEXT,                                   -- null = all (super only)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email   ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_complex ON admin_users(complex);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
-- Service role만 R/W. anon/authenticated 정책 없음 (API 경유만 허용).

-- ────────────────────────────────────────────────────────────
-- 최초 슈퍼관리자 등록 방법 (수동 1회)
-- ────────────────────────────────────────────────────────────
-- 1. Supabase Dashboard → Authentication → Users → "Add user"
--    email + password 로 새 유저 생성.
-- 2. 해당 유저의 auth_user_id(UUID) 복사.
-- 3. 아래 쿼리 실행 (UUID와 email 교체):
--
--    INSERT INTO admin_users (auth_user_id, email, name, role, complex)
--    VALUES (
--      '<auth_user_id-from-step-2>'::uuid,
--      'admin@heliocity.kr',
--      '김관리',
--      'super',     -- super = 전체 단지, admin = 본인 단지, viewer = 읽기전용
--      NULL         -- super는 NULL, 단지 관리자는 'heliocity' 등 slug
--    );
