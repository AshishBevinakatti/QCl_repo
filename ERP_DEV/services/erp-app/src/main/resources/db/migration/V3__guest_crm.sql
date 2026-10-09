-- V3: guest CRM — guest + communication history + demo seed.
-- Forward-only (never edit after apply). Portable SQL (Postgres runtime, H2-PG-mode tests).

CREATE TABLE guest (
  id UUID PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES property (id),
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  id_type VARCHAR(50),
  preferences TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  merged_into UUID REFERENCES guest (id)
);
-- One profile per phone: the DB guarantees it (same script runs on Postgres
-- and H2, which has no partial indexes). Same-phone re-registration therefore
-- 409s at create time; merge() handles same-person-different-phone cases and
-- keeps both rows for history.
CREATE UNIQUE INDEX uq_guest_property_phone ON guest (property_id, phone);
CREATE INDEX idx_guest_property_name ON guest (property_id, name);
CREATE INDEX idx_guest_property_phone ON guest (property_id, phone);

CREATE TABLE guest_communication (
  id UUID PRIMARY KEY,
  guest_id UUID NOT NULL REFERENCES guest (id),
  channel VARCHAR(50) NOT NULL,
  template VARCHAR(200) NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  status VARCHAR(50) NOT NULL DEFAULT 'sent'
);
CREATE INDEX idx_guest_comm_guest ON guest_communication (guest_id, sent_at);

-- Demo seed (dev only — clearly marked; real data migrates per SOW §29.1).
INSERT INTO guest (id, property_id, name, phone, id_type, preferences, status) VALUES
  ('77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', 'Aarav Sharma', '+91-9822000001', 'Aadhaar', '{"preference": "veg", "floor": "high"}', 'active'),
  ('88888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', 'Diya Patel', '+91-9822000002', 'Passport', '{"preference": "sea-view"}', 'active'),
  ('99999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', 'John Dsouza', '+91-9822000003', 'DrivingLicence', '{}', 'active');
