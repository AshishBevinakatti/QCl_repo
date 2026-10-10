-- V6: billing — folios, payments, invoices, refunds + gateway config.
-- Forward-only (never edit after apply). Portable SQL (Postgres + H2-PG-mode).
-- Money in paise; folio entries are SIGNED (charges +, payments/credits -).

CREATE TABLE folio (
  id UUID PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES property (id),
  guest_id UUID NOT NULL REFERENCES guest (id),
  stay_id UUID REFERENCES stay (id),
  member_id UUID,
  status VARCHAR(50) NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_folio_stay ON folio (stay_id);
CREATE INDEX idx_folio_guest ON folio (guest_id, status);

CREATE TABLE folio_entry (
  id UUID PRIMARY KEY,
  folio_id UUID NOT NULL REFERENCES folio (id),
  source_type VARCHAR(50) NOT NULL,
  source_id VARCHAR(200) NOT NULL,
  amount_paise BIGINT NOT NULL,
  actor VARCHAR(320) NOT NULL DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_folio_entry_folio ON folio_entry (folio_id);

CREATE TABLE payment (
  id UUID PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES property (id),
  folio_id UUID REFERENCES folio (id),
  booking_id UUID REFERENCES reservation (id),
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  gateway_ref VARCHAR(200),
  idempotency_key VARCHAR(200) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_payment_idem UNIQUE (property_id, idempotency_key)
);
CREATE INDEX idx_payment_booking ON payment (booking_id, status);

CREATE TABLE invoice (
  id UUID PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES property (id),
  folio_id UUID NOT NULL REFERENCES folio (id),
  lines TEXT NOT NULL,
  tax_paise BIGINT NOT NULL,
  total_paise BIGINT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'issued',
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_invoice_folio ON invoice (folio_id);

CREATE TABLE refund (
  id UUID PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES property (id),
  payment_id UUID NOT NULL REFERENCES payment (id),
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  reason VARCHAR(500),
  approver VARCHAR(320),
  status VARCHAR(50) NOT NULL DEFAULT 'requested',
  idempotency_key VARCHAR(200) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_refund_idem UNIQUE (property_id, idempotency_key)
);
CREATE INDEX idx_refund_payment ON refund (payment_id, status);

-- Gateway selection + sandbox secret (sandbox value is a DEV-ONLY fake;
-- real secrets live in Vault/K8s Secrets, never here).
INSERT INTO app_config (config_key, config_value) VALUES
  ('gateway.provider', 'sandbox'),
  ('gateway.webhook_secret', 'sandbox-secret-CHANGE-ME');
