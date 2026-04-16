-- ============================================================
-- Carpark MVP — Seed Data
-- 12 realistic Korean apartment complexes with varied counts
-- Run AFTER schema.sql
-- ============================================================

INSERT INTO apartments (name, address, district, city, slug, participant_goal)
VALUES
  (
    '래미안 퍼스티지',
    '서울특별시 서초구 반포동 19',
    '서초구', '서울특별시',
    'raemian-prestige', 50
  ),
  (
    '아크로리버파크',
    '서울특별시 서초구 반포동 1-1',
    '서초구', '서울특별시',
    'acro-river-park', 50
  ),
  (
    '헬리오시티',
    '서울특별시 송파구 가락동 100',
    '송파구', '서울특별시',
    'helio-city', 100
  ),
  (
    '잠실 엘스',
    '서울특별시 송파구 잠실동 210',
    '송파구', '서울특별시',
    'jamsil-els', 50
  ),
  (
    '은마아파트',
    '서울특별시 강남구 대치동 310',
    '강남구', '서울특별시',
    'eunma', 50
  ),
  (
    '마포 래미안 푸르지오',
    '서울특별시 마포구 아현동 627',
    '마포구', '서울특별시',
    'mapo-raemian-prugio', 50
  ),
  (
    'e편한세상 금호 파크힐스',
    '서울특별시 성동구 금호동 1가 21',
    '성동구', '서울특별시',
    'e-the-world-geumho', 50
  ),
  (
    '롯데캐슬 이스트폴',
    '서울특별시 송파구 문정동 150',
    '송파구', '서울특별시',
    'lotte-castle-eastpole', 50
  ),
  (
    '디에이치 자이 개포',
    '서울특별시 강남구 개포동 1247',
    '강남구', '서울특별시',
    'dh-xi-gaepo', 50
  ),
  (
    '반포 자이',
    '서울특별시 서초구 반포동 84',
    '서초구', '서울특별시',
    'banpo-xi', 50
  ),
  (
    '목동 신시가지 7단지',
    '서울특별시 양천구 목동 923',
    '양천구', '서울특별시',
    'mokdong-new-town-7', 80
  ),
  (
    '분당 파크뷰',
    '경기도 성남시 분당구 수내동 20',
    '분당구', '성남시',
    'bundang-park-view', 50
  )
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Seed fake interest signals for social proof on the demo.
-- These use placeholder auth_user_ids that will never
-- collide with real Kakao IDs (which are prefixed "kakao_").
-- ============================================================

-- Helper: insert signals for a given apartment slug + N fake users
DO $$
DECLARE
  apt_id UUID;
  counts INTEGER[] := ARRAY[38, 29, 61, 22, 44, 17, 8, 31, 19, 47, 12, 5];
  slugs  TEXT[]   := ARRAY[
    'raemian-prestige', 'acro-river-park', 'helio-city', 'jamsil-els',
    'eunma', 'mapo-raemian-prugio', 'e-the-world-geumho', 'lotte-castle-eastpole',
    'dh-xi-gaepo', 'banpo-xi', 'mokdong-new-town-7', 'bundang-park-view'
  ];
  i INTEGER;
  j INTEGER;
  signal TEXT;
BEGIN
  FOR i IN 1..array_length(slugs, 1) LOOP
    SELECT id INTO apt_id FROM apartments WHERE slug = slugs[i];
    IF apt_id IS NULL THEN CONTINUE; END IF;

    FOR j IN 1..counts[i] LOOP
      -- Alternate signal types for variety
      signal := CASE WHEN j % 3 = 0 THEN 'good_to_review' ELSE 'participate_if_adopted' END;

      INSERT INTO apartment_interest_signals (apartment_id, auth_user_id, signal_type)
      VALUES (apt_id, 'seed_user_' || i || '_' || j, signal)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$;
