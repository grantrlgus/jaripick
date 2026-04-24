-- JariPick 시연용 데모 데이터 시드
-- 전제: wipe_test_data.sql 실행 후 빈 상태에서 주입.
--       parking_cells / admin_users / complex_config / apartments 는 그대로.
--
-- 구성:
--   - 세대 7개 (101동 1201호 등)
--   - 입주민 신청 4건 (승인3 + 대기1)
--   - 진행중 회차 1개 (bid_end 는 3일 뒤)
--   - 입찰 8건 (A-23 / B-07 / C-03 등에 경쟁)
--   - 결제 6건 (완납 3, 대기 2, 연체 1)
--   - 민원 3건 (단지운영 답변완료, 단지운영 열림, 플랫폼 에스컬레이션)

BEGIN;

-- ───────────────────────────────────────────────
-- 1. 세대 (활성 입주민)
-- ───────────────────────────────────────────────
INSERT INTO households (complex, dong, ho, name, phone, status) VALUES
  ('heliocity', '101', '1201', '김민수', '010-1111-2001', 'active'),
  ('heliocity', '101', '1502', '이서연', '010-1111-2002', 'active'),
  ('heliocity', '102',  '803', '박지훈', '010-1111-2003', 'active'),
  ('heliocity', '103',  '902', '최유진', '010-1111-2004', 'active'),
  ('heliocity', '105',  '401', '정다은', '010-1111-2005', 'active'),
  ('heliocity', '107', '1101', '한태호', '010-1111-2006', 'active'),
  ('heliocity', '108',  '305', '윤하늘', '010-1111-2007', 'active');

-- ───────────────────────────────────────────────
-- 2. 입주민 신청 (pending 큐)
-- ───────────────────────────────────────────────
INSERT INTO resident_requests (complex, dong, ho, name, phone, car_plate, car_size, ev, reason, status, auto, decided_at) VALUES
  ('heliocity', '101', '1201', '김민수', '010-1111-2001', '12가 3456', 'mid',  false, NULL, 'approved', true,  NOW() - INTERVAL '3 days'),
  ('heliocity', '102',  '803', '박지훈', '010-1111-2003', '34나 5678', 'large', true,  NULL, 'approved', true,  NOW() - INTERVAL '2 days'),
  ('heliocity', '107', '1101', '한태호', '010-1111-2006', '56다 7890', 'mid',  false, NULL, 'approved', true,  NOW() - INTERVAL '1 day'),
  ('heliocity', '109',  '502', '오가영', '010-1111-2008', '78라 1234', 'small', false, '명부에 없음', 'pending',  false, NULL);

-- ───────────────────────────────────────────────
-- 3. 회차 (진행중 입찰)
--    bid_start: 2일 전 / bid_end: 3일 뒤 / 계약: 다음달 1일 ~ 30일
-- ───────────────────────────────────────────────
INSERT INTO rounds (id, complex, name, bid_start, bid_end, contract_start, contract_end, status)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'heliocity',
  '2026년 5월 정기 입찰',
  NOW() - INTERVAL '2 days',
  NOW() + INTERVAL '3 days',
  (date_trunc('month', NOW()) + INTERVAL '1 month')::date,
  (date_trunc('month', NOW()) + INTERVAL '2 months' - INTERVAL '1 day')::date,
  'live'
);

-- ───────────────────────────────────────────────
-- 4. 입찰 (A-23 경쟁 3건, C-03 경쟁 2건, B-07/B-09 각 1건, D-11 1건)
-- ───────────────────────────────────────────────
INSERT INTO bids (round_id, cell_id, dong, ho, name, amount, created_at) VALUES
  -- A-23 인기 구역 (3파전)
  ('11111111-1111-1111-1111-111111111111', 'A-23', '101', '1201', '김민수', 160000, NOW() - INTERVAL '18 hours'),
  ('11111111-1111-1111-1111-111111111111', 'A-23', '103',  '902', '최유진', 180000, NOW() - INTERVAL '12 hours'),
  ('11111111-1111-1111-1111-111111111111', 'A-23', '107', '1101', '한태호', 200000, NOW() - INTERVAL '4 hours'),

  -- C-03 (2파전)
  ('11111111-1111-1111-1111-111111111111', 'C-03', '101', '1502', '이서연', 140000, NOW() - INTERVAL '20 hours'),
  ('11111111-1111-1111-1111-111111111111', 'C-03', '105',  '401', '정다은', 155000, NOW() - INTERVAL '6 hours'),

  -- 단독 입찰
  ('11111111-1111-1111-1111-111111111111', 'B-07', '102',  '803', '박지훈', 120000, NOW() - INTERVAL '30 hours'),
  ('11111111-1111-1111-1111-111111111111', 'B-09', '108',  '305', '윤하늘',  90000, NOW() - INTERVAL '10 hours'),
  ('11111111-1111-1111-1111-111111111111', 'D-11', '101', '1201', '김민수',  80000, NOW() - INTERVAL '2 hours');

-- ───────────────────────────────────────────────
-- 5. 결제 (지난 회차 정산 — 완납 3, 대기 2, 연체 1)
--    round_id 는 아무 UUID로 (끝난 회차 참조용)
-- ───────────────────────────────────────────────
INSERT INTO rounds (id, complex, name, bid_start, bid_end, contract_start, contract_end, status)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'heliocity',
  '2026년 4월 정기 입찰',
  NOW() - INTERVAL '32 days',
  NOW() - INTERVAL '28 days',
  (date_trunc('month', NOW()))::date,
  (date_trunc('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 day')::date,
  'finalized'
);

INSERT INTO payments (complex, round_id, cell_id, dong, ho, name, period, amount, status, due_date, paid_at, memo) VALUES
  ('heliocity', '22222222-2222-2222-2222-222222222222', 'A-23', '103',  '902', '최유진', '2026-04', 170000, 'paid',    (NOW() - INTERVAL '10 days')::date, NOW() - INTERVAL '12 days', '카카오페이'),
  ('heliocity', '22222222-2222-2222-2222-222222222222', 'B-07', '102',  '803', '박지훈', '2026-04', 110000, 'paid',    (NOW() - INTERVAL '10 days')::date, NOW() - INTERVAL '11 days', '관리비 합산'),
  ('heliocity', '22222222-2222-2222-2222-222222222222', 'C-03', '105',  '401', '정다은', '2026-04', 130000, 'paid',    (NOW() - INTERVAL '10 days')::date, NOW() - INTERVAL '10 days', '계좌이체'),
  ('heliocity', '22222222-2222-2222-2222-222222222222', 'D-11', '101', '1502', '이서연', '2026-04',  95000, 'pending', (NOW() + INTERVAL '3 days')::date,  NULL, NULL),
  ('heliocity', '22222222-2222-2222-2222-222222222222', 'B-09', '108',  '305', '윤하늘', '2026-04',  85000, 'pending', (NOW() + INTERVAL '3 days')::date,  NULL, NULL),
  ('heliocity', '22222222-2222-2222-2222-222222222222', 'E-02', '107', '1101', '한태호', '2026-04', 150000, 'overdue', (NOW() - INTERVAL '5 days')::date,  NULL, '1차 독촉 발송');

-- ───────────────────────────────────────────────
-- 6. 민원 / 문의
-- ───────────────────────────────────────────────
INSERT INTO complaints (id, complex, dong, ho, author_name, phone, category, title, body, status, created_at, updated_at) VALUES
  (
    '33333333-3333-3333-3333-333333333301',
    'heliocity', '101', '1201', '김민수', '010-1111-2001',
    'complex',
    'A-23 구역 야간 조명이 너무 어두워요',
    '저녁에 주차할 때 번호판이 잘 안 보입니다. LED 교체 부탁드립니다.',
    'in_progress',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day'
  ),
  (
    '33333333-3333-3333-3333-333333333302',
    'heliocity', '102', '803', '박지훈', '010-1111-2003',
    'complex',
    '전기차 충전기 추가 설치 문의',
    'B동 쪽은 충전기가 한 개뿐이라 자주 대기해야 합니다. 추가 설치 계획이 있을까요?',
    'open',
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '6 hours'
  ),
  (
    '33333333-3333-3333-3333-333333333303',
    'heliocity', '105', '401', '정다은', '010-1111-2005',
    'platform',
    '앱에서 입찰 금액 수정이 안돼요',
    '입찰 후 금액을 바꾸려 하는데 버튼이 안 눌립니다. iOS 17.2 입니다.',
    'escalated',
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '3 hours'
  );

-- 민원 답변 (관리자 → 1번 민원, 플랫폼 시스템 → 3번 민원)
INSERT INTO complaint_replies (complaint_id, author_role, author_name, body, created_at) VALUES
  (
    '33333333-3333-3333-3333-333333333301',
    'admin', '관리자',
    '확인해 드리겠습니다. 이번 주 내로 LED 교체 작업 잡아두었어요. 불편을 드려 죄송합니다.',
    NOW() - INTERVAL '1 day'
  ),
  (
    '33333333-3333-3333-3333-333333333303',
    'system', '자리픽 시스템',
    '앱/플랫폼 관련 문의는 자리픽 운영팀에 자동으로 전달되었어요. 빠른 시일 내로 확인 후 답변드리겠습니다.',
    NOW() - INTERVAL '3 hours' + INTERVAL '5 seconds'
  );

COMMIT;

-- 확인:
--   SELECT count(*) FROM households;            -- 7
--   SELECT count(*) FROM resident_requests;     -- 4
--   SELECT count(*) FROM rounds;                -- 2
--   SELECT count(*) FROM bids;                  -- 8
--   SELECT count(*) FROM payments;              -- 6
--   SELECT count(*) FROM complaints;            -- 3
--   SELECT count(*) FROM complaint_replies;     -- 2
