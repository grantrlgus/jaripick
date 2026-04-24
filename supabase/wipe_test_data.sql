-- JariPick 테스트 데이터 제거
-- 유지: admin_users, complex_config, parking_cells, apartments (카카오 디렉토리 등)
-- 제거: 운영 중 쌓인 테스트 민원/입찰/회차/세대/결제 등
--
-- 사용법: Supabase SQL Editor에서 일괄 실행
--   ⚠️ 프로덕션 DB에서 실행 시 복구 불가. 시연 전 정리용으로만 사용.

BEGIN;

-- 민원 스레드 (replies는 FK CASCADE로 자동 삭제되지만 명시적으로)
DELETE FROM complaint_replies;
DELETE FROM complaints;

-- 결제 / 입찰 / 회차
DELETE FROM payments;
DELETE FROM bids;
DELETE FROM rounds;

-- 입주민 신청 / 세대 / 관심 시그널
DELETE FROM resident_requests;
DELETE FROM households;
DELETE FROM apartment_interest_signals;

-- 알림 로그
DELETE FROM notices;

-- 사용자 프로필 (로그인한 입주민 제거 — 로그인 다시 유도)
DELETE FROM user_profiles;

COMMIT;

-- 유지 확인:
--   SELECT count(*) FROM admin_users;       -- 관리자 계정 (superman@jaripick.com 등)
--   SELECT count(*) FROM complex_config;    -- 단지 설정
--   SELECT count(*) FROM parking_cells;     -- 주차 셀 레이아웃
--   SELECT count(*) FROM apartments;        -- 아파트 디렉토리
