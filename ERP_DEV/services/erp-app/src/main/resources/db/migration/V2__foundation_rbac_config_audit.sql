-- V2: foundation — users, role permissions, config, audit log + seeds.
-- Forward-only (never edit after apply). TEXT (not JSONB) for config/audit payloads
-- so the same script runs on Postgres (runtime) and H2-PG-mode (tests).

CREATE TABLE app_user (
  id UUID PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES property (id),
  name VARCHAR(200) NOT NULL,
  email VARCHAR(320) NOT NULL,
  role VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  CONSTRAINT uq_app_user_property_email UNIQUE (property_id, email)
);

CREATE TABLE role_permission (
  role VARCHAR(50) NOT NULL,
  permission VARCHAR(100) NOT NULL,
  CONSTRAINT pk_role_permission PRIMARY KEY (role, permission)
);

CREATE TABLE app_config (
  config_key VARCHAR(200) PRIMARY KEY,
  config_value TEXT NOT NULL,
  effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_by VARCHAR(320) NOT NULL DEFAULT 'seed',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_event (
  id UUID PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES property (id),
  actor VARCHAR(320) NOT NULL,
  action VARCHAR(100) NOT NULL,
  object_type VARCHAR(100) NOT NULL,
  object_id VARCHAR(200) NOT NULL,
  before_json TEXT,
  after_json TEXT,
  reason VARCHAR(500),
  source_ip VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_object ON audit_event (object_type, object_id);
CREATE INDEX idx_audit_actor ON audit_event (actor, created_at);

-- Seed: [ASSUMED] role matrix (security.md) — least privilege, deny-by-default.
INSERT INTO role_permission (role, permission) VALUES
  ('SUPERADMIN', '*'),
  ('MANAGER', 'bookings:approve'), ('MANAGER', 'reports:view'), ('MANAGER', 'refunds:approve'),
  ('MANAGER', 'members:approve'), ('MANAGER', 'overrides:apply'),
  ('RECEPTION', 'bookings:create'), ('RECEPTION', 'bookings:edit'), ('RECEPTION', 'stays:checkin'),
  ('RECEPTION', 'guests:view'), ('RECEPTION', 'guests:edit'), ('RECEPTION', 'payments:collect'),
  ('MEMBERSHIP', 'members:enroll'), ('MEMBERSHIP', 'members:link'), ('MEMBERSHIP', 'rfid:manage'),
  ('ACCOUNTS', 'payments:collect'), ('ACCOUNTS', 'invoices:manage'), ('ACCOUNTS', 'refunds:manage'),
  ('ACCOUNTS', 'reports:financial'),
  ('HOUSEKEEPING', 'housekeeping:tasks'),
  ('OPS', 'facilities:manage');

-- Seed: [ASSUMED] business defaults (D-101…D-114) — admin-editable via /api/v1/config.
INSERT INTO app_config (config_key, config_value) VALUES
  ('booking.hold_minutes', '15'),
  ('booking.advance_pct', '30'),
  ('booking.cancellation', '{"free_hours_before": 48, "late_fee": "1-night"}'),
  ('pricing.weekend_uplift_pct', '20'),
  ('pricing.promos', '{"WELCOME10": 10}'),
  ('tax.gst_pct', '12'),
  ('loyalty.earn_per_rs100', '1'),
  ('loyalty.redeem_100pts_rs', '100'),
  ('membership.validity_days', '365'),
  ('checkin.time', '12:00'),
  ('checkout.time', '11:00'),
  ('ota.sync_minutes', '5'),
  ('ota.sync_retries', '3'),
  ('rfid.offline_policy', 'deny-safe');

-- Seed: demo users (dev only — prod gets real Keycloak users, no passwords here).
INSERT INTO app_user (id, property_id, name, email, role, status) VALUES
  ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'Admin', 'admin@goldenhills.example', 'SUPERADMIN', 'active'),
  ('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'Reception Demo', 'reception@goldenhills.example', 'RECEPTION', 'active');
