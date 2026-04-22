-- Demo E2E tables: resident requests, rounds, bids, complex config, notices.
-- Run in Supabase SQL editor.

-- ───────────────────────────────────────────────
-- Resident join requests (pending / approved / rejected)
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resident_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex     TEXT NOT NULL DEFAULT 'heliocity',
  dong        TEXT NOT NULL,
  ho          TEXT NOT NULL,
  name        TEXT NOT NULL,
  phone       TEXT,
  car_plate   TEXT,
  car_size    TEXT,
  ev          BOOLEAN DEFAULT false,
  reason      TEXT,                       -- why it went to manual queue (null if auto-approved)
  status      TEXT NOT NULL DEFAULT 'pending',  -- pending / approved / rejected
  auto        BOOLEAN DEFAULT false,       -- whether auto-approved via roster match
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_resident_requests_status ON resident_requests(status);
CREATE INDEX IF NOT EXISTS idx_resident_requests_complex ON resident_requests(complex);

-- ───────────────────────────────────────────────
-- Rounds (bidding cycles)
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rounds (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex         TEXT NOT NULL DEFAULT 'heliocity',
  name            TEXT NOT NULL,
  bid_start       TIMESTAMPTZ NOT NULL,
  bid_end         TIMESTAMPTZ NOT NULL,
  contract_start  DATE NOT NULL,
  contract_end    DATE NOT NULL,
  status          TEXT NOT NULL DEFAULT 'live',  -- live / closed / finalized
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rounds_status ON rounds(status);

-- ───────────────────────────────────────────────
-- Bids (app users bidding on cells within a round)
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bids (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id    UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  cell_id     TEXT NOT NULL,     -- matches parking_cells.id (also string id)
  dong        TEXT NOT NULL,
  ho          TEXT NOT NULL,
  name        TEXT NOT NULL,
  amount      INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bids_round ON bids(round_id);
CREATE INDEX IF NOT EXISTS idx_bids_cell ON bids(round_id, cell_id);

-- ───────────────────────────────────────────────
-- Complex configuration (key-value for single complex)
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS complex_config (
  complex        TEXT PRIMARY KEY DEFAULT 'heliocity',
  name           TEXT,
  address        TEXT,
  total_units    INTEGER,
  min_bid        INTEGER DEFAULT 50000,
  bid_rule       TEXT DEFAULT 'higher_only',   -- only "strictly higher than top" allowed
  payment_mode   TEXT DEFAULT 'kwanri_bundle', -- 관리비 합산
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO complex_config (complex, name, address, total_units)
VALUES ('heliocity', '오금현대', '서울특별시 송파구 오금로 223', 1124)
ON CONFLICT (complex) DO NOTHING;

-- ───────────────────────────────────────────────
-- Notices (admin → residents)
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notices (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex     TEXT NOT NULL DEFAULT 'heliocity',
  target      TEXT NOT NULL DEFAULT 'all',  -- all / round / winners
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  recipient_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_notices_complex ON notices(complex, sent_at DESC);
