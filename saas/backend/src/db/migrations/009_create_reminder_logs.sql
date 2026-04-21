CREATE TABLE IF NOT EXISTS reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id),
  type VARCHAR(10) NOT NULL CHECK (type IN ('24h', '1h')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  twilio_sid VARCHAR(60),
  status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'failed'))
);
