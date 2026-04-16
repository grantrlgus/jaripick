-- ============================================================
-- Carpark MVP — Supabase Schema
-- Run this in the Supabase SQL Editor (or via supabase db push)
-- ============================================================

-- 1. Apartments
CREATE TABLE IF NOT EXISTS apartments (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT        NOT NULL,
  address          TEXT        NOT NULL,
  district         TEXT        NOT NULL,
  city             TEXT        NOT NULL DEFAULT '서울특별시',
  slug             TEXT        NOT NULL UNIQUE,
  participant_goal INTEGER     NOT NULL DEFAULT 50,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apartments_slug ON apartments(slug);
CREATE INDEX IF NOT EXISTS idx_apartments_name ON apartments USING gin (to_tsvector('simple', name));

-- 2. User profiles (mirrors NextAuth JWT identity)
CREATE TABLE IF NOT EXISTS user_profiles (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id TEXT        NOT NULL UNIQUE, -- "kakao_{providerAccountId}"
  provider     TEXT        NOT NULL DEFAULT 'kakao',
  display_name TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_user_id ON user_profiles(auth_user_id);

-- 3. Interest signals (anonymous — no login required)
CREATE TABLE IF NOT EXISTS apartment_interest_signals (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id UUID        NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  anon_id      TEXT        NOT NULL,  -- IP address or localStorage token; loose dedup only
  signal_type  TEXT        NOT NULL CHECK (signal_type IN ('participate_if_adopted', 'good_to_review')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (apartment_id, anon_id)  -- one signal per identifier per apartment
);

CREATE INDEX IF NOT EXISTS idx_signals_apartment_id ON apartment_interest_signals(apartment_id);
CREATE INDEX IF NOT EXISTS idx_signals_anon_id      ON apartment_interest_signals(anon_id);

-- ============================================================
-- View: apartments with participant counts
-- Used by all read queries instead of joining every time
-- ============================================================
CREATE OR REPLACE VIEW apartment_with_counts AS
SELECT
  a.id,
  a.name,
  a.address,
  a.district,
  a.city,
  a.slug,
  a.participant_goal,
  a.created_at,
  COALESCE(COUNT(s.id), 0)::INTEGER AS participant_count
FROM apartments a
LEFT JOIN apartment_interest_signals s ON s.apartment_id = a.id
GROUP BY a.id;

-- ============================================================
-- RLS Policies
-- Apartments and counts are public; signals are written
-- only via the service role key (server action).
-- ============================================================
ALTER TABLE apartments                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartment_interest_signals  ENABLE ROW LEVEL SECURITY;

-- Public read on apartments
CREATE POLICY "apartments_public_read" ON apartments
  FOR SELECT USING (true);

-- Public read on signals (for participant counts)
CREATE POLICY "signals_public_read" ON apartment_interest_signals
  FOR SELECT USING (true);

-- Service role can do everything (server actions use service key)
-- The service role bypasses RLS by default in Supabase, so no
-- explicit policy is needed for INSERT/UPDATE/DELETE.
