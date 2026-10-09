-- V1: slice schema — property + room_category + seed.
-- Forward-only migration (never edit after apply). Full domain tables arrive in Phase 3.0/3.2.
-- Money in paise BIGINT; property-scoped keys from day one (see data-model.md).

CREATE TABLE property (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  status VARCHAR(50) NOT NULL
);

CREATE TABLE room_category (
  id UUID PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES property (id),
  name VARCHAR(200) NOT NULL,
  base_price_paise BIGINT NOT NULL CHECK (base_price_paise >= 0),
  capacity INT NOT NULL CHECK (capacity > 0),
  CONSTRAINT uq_room_category_property_name UNIQUE (property_id, name)
);

-- Seed: demo property + 3 categories ([ASSUMED] MVP defaults from Phase 1 baseline).
INSERT INTO property (id, name, status) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Golden Hills Resort', 'active');

INSERT INTO room_category (id, property_id, name, base_price_paise, capacity) VALUES
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Deluxe', 500000, 2),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Suite', 900000, 3),
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Villa', 1500000, 4);
