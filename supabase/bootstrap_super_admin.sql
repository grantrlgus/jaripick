-- ============================================================
-- 슈퍼관리자 1회 부트스트랩
-- ============================================================
-- 사용법:
-- 1) Supabase Dashboard → Authentication → Users → "Add user"
--    이메일 + 비밀번호로 첫 슈퍼관리자 계정 생성.
--    (이메일 인증 옵션은 Auto Confirm User = true 권장)
-- 2) 생성된 유저의 ID(UUID)를 복사.
-- 3) 아래 두 변수 채워서 Supabase SQL Editor 에서 실행.
--
-- ※ 보안: 슈퍼관리자 비밀번호는 길고 강하게. 실서비스에서는 2FA 필수.

DO $$
DECLARE
  v_auth_user_id UUID := '<여기에-auth.users-의-UUID-붙여넣기>'::uuid;
  v_email        TEXT := 'super@jaripick.com';
  v_name         TEXT := '슈퍼관리자';
BEGIN
  -- 이미 등록돼있으면 무시
  IF EXISTS (SELECT 1 FROM admin_users WHERE auth_user_id = v_auth_user_id) THEN
    RAISE NOTICE '이미 admin_users 에 등록된 사용자입니다.';
    RETURN;
  END IF;

  INSERT INTO admin_users (auth_user_id, email, name, role, complex)
  VALUES (
    v_auth_user_id,
    v_email,
    v_name,
    'super',  -- super = 전체 단지 R/W, 단지 관리자 초대 가능
    NULL      -- super 는 NULL (모든 단지)
  );

  RAISE NOTICE '슈퍼관리자 등록 완료: %', v_email;
END $$;

-- 확인:
-- SELECT id, email, role, complex, created_at FROM admin_users;
