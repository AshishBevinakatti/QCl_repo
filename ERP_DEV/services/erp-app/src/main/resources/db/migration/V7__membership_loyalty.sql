-- V7: membership & loyalty — members, tiers, append-only points ledger.
-- Forward-only (never edit after apply). Portable SQL (Postgres + H2-PG-mode).
-- Balances derive from the ledger (never stored on the member row).

CREATE TABLE member (
  id UUID PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES property (id),
  guest_id UUID NOT NULL REFERENCES guest (id),
  membership_no VARCHAR(50) NOT NULL,
  tier VARCHAR(50) NOT NULL DEFAULT 'Silver',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  CONSTRAINT uq_member_guest UNIQUE (guest_id),
  CONSTRAINT uq_member_no UNIQUE (property_id, membership_no)
);
CREATE INDEX idx_member_status ON member (property_id, status, valid_to);

CREATE TABLE loyalty_ledger (
  id UUID PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES member (id),
  points_delta INT NOT NULL,
  balance_after INT NOT NULL,
  reason VARCHAR(200) NOT NULL,
  ref_type VARCHAR(50) NOT NULL,
  ref_id VARCHAR(200) NOT NULL,
  actor VARCHAR(320) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_ledger_ref UNIQUE (member_id, ref_type, ref_id)
);
CREATE INDEX idx_ledger_member ON loyalty_ledger (member_id, created_at);

CREATE TABLE tier_rule (
  tier VARCHAR(50) PRIMARY KEY,
  min_spend_paise BIGINT NOT NULL DEFAULT 0,
  earn_per_rs100 INT NOT NULL DEFAULT 1,
  benefits TEXT NOT NULL DEFAULT '{}'
);

-- Seed: [ASSUMED] tiers (D-108). Spend floors gate upgrades; earn rate is
-- points per Rs 100 paid (floored on paise).
INSERT INTO tier_rule (tier, min_spend_paise, earn_per_rs100, benefits) VALUES
  ('Silver', 0, 1, '{"discount_pct": 0}'),
  ('Gold', 1000000, 1, '{"discount_pct": 5}'),
  ('Platinum', 5000000, 2, '{"discount_pct": 10}');
