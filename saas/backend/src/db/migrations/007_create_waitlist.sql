CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  service_id UUID NOT NULL REFERENCES services(id),
  desired_date DATE NOT NULL,
  desired_time TIME NOT NULL,
  position INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'notified', 'confirmed', 'expired', 'cancelled')),
  notified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(desired_date, desired_time, client_id)
);

CREATE INDEX idx_waitlist_slot ON waitlist(desired_date, desired_time, status, position);
