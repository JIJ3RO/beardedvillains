CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  service_id UUID NOT NULL REFERENCES services(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'in_shop' CHECK (type IN ('in_shop', 'home_visit')),
  address TEXT,
  home_visit_fee NUMERIC(8,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
  cancelled_by VARCHAR(20) CHECK (cancelled_by IN ('client', 'barber')),
  notes TEXT,
  reminder_24h_sent BOOLEAN NOT NULL DEFAULT false,
  reminder_1h_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_appointments_scheduled ON appointments(scheduled_at, status);
CREATE INDEX idx_appointments_client ON appointments(client_id);
