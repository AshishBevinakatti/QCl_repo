-- V5: front-office + housekeeping — stays, transfers, cleaning tasks.
-- Forward-only (never edit after apply). Portable SQL (Postgres + H2-PG-mode).
-- Single-writer rule (code-enforced, reviewed): front-office owns
-- occupied/dirty transitions; housekeeping owns cleaning→ready.

CREATE TABLE stay (
  id UUID PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES property (id),
  reservation_id UUID NOT NULL REFERENCES reservation (id),
  room_id UUID NOT NULL REFERENCES room (id),
  checkin_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  checkout_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) NOT NULL DEFAULT 'checked-in',
  CONSTRAINT uq_stay_reservation UNIQUE (reservation_id)
);
CREATE INDEX idx_stay_room_status ON stay (room_id, status);

CREATE TABLE room_transfer (
  id UUID PRIMARY KEY,
  stay_id UUID NOT NULL REFERENCES stay (id),
  from_room_id UUID NOT NULL REFERENCES room (id),
  to_room_id UUID NOT NULL REFERENCES room (id),
  actor VARCHAR(320) NOT NULL,
  reason VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_transfer_stay ON room_transfer (stay_id);

CREATE TABLE housekeeping_task (
  id UUID PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES property (id),
  room_id UUID NOT NULL REFERENCES room (id),
  assignee VARCHAR(320),
  status VARCHAR(50) NOT NULL DEFAULT 'todo',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_hsk_status ON housekeeping_task (property_id, status);
CREATE INDEX idx_hsk_room ON housekeeping_task (room_id, status);
