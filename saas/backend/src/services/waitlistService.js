const pool = require('../config/database');
const { formatLocal, localToUTC } = require('../utils/dateUtils');
const { format } = require('date-fns');
const { toZonedTime } = require('date-fns-tz');

const TZ = () => process.env.BARBER_TIMEZONE || 'America/Mexico_City';
const EXPIRY_MINUTES = () => parseInt(process.env.WAITLIST_EXPIRY_MINUTES || '30', 10);

async function addToWaitlist(clientId, serviceId, desiredDate, desiredTime) {
  // Get current max position for this slot
  const { rows } = await pool.query(
    `SELECT COALESCE(MAX(position), 0) as max_pos FROM waitlist
     WHERE desired_date=$1 AND desired_time=$2 AND status='waiting'`,
    [desiredDate, desiredTime]
  );
  const position = rows[0].max_pos + 1;

  await pool.query(
    `INSERT INTO waitlist(client_id, service_id, desired_date, desired_time, position)
     VALUES($1,$2,$3,$4,$5)
     ON CONFLICT(desired_date, desired_time, client_id) DO NOTHING`,
    [clientId, serviceId, desiredDate, desiredTime, position]
  );

  return { position };
}

async function notifyWaitlist(cancelledAppointment) {
  const local = toZonedTime(new Date(cancelledAppointment.scheduled_at), TZ());
  const desiredDate = format(local, 'yyyy-MM-dd');
  const desiredTime = format(local, 'HH:mm');

  const { rows } = await pool.query(
    `SELECT w.*, c.phone, c.name FROM waitlist w
     JOIN clients c ON c.id = w.client_id
     WHERE w.desired_date=$1 AND w.desired_time=$2 AND w.status='waiting'
     ORDER BY w.position ASC LIMIT 1`,
    [desiredDate, desiredTime]
  );

  if (!rows.length) return;

  const entry = rows[0];
  const expiresAt = new Date(Date.now() + EXPIRY_MINUTES() * 60 * 1000);

  await pool.query(
    `UPDATE waitlist SET status='notified', notified_at=NOW(), expires_at=$1 WHERE id=$2`,
    [expiresAt, entry.id]
  );

  const { sendMessage } = require('./twilioService');
  const msg = `¡Hola ${entry.name || 'cliente'}! 🎉 Se liberó un lugar el *${desiredDate}* a las *${desiredTime}*.\n¿Lo quieres? Responde *SÍ* para confirmar.\nTienes ${EXPIRY_MINUTES()} minutos.`;
  await sendMessage(entry.phone, msg);
}

async function expireAndRenotify() {
  // Find expired notified entries
  const { rows: expired } = await pool.query(
    `UPDATE waitlist SET status='expired' WHERE status='notified' AND expires_at < NOW()
     RETURNING desired_date, desired_time, service_id`,
    []
  );

  // For each expired slot, try to notify the next waiting person
  for (const slot of expired) {
    const { rows } = await pool.query(
      `SELECT w.*, c.phone, c.name FROM waitlist w
       JOIN clients c ON c.id = w.client_id
       WHERE w.desired_date=$1 AND w.desired_time=$2 AND w.status='waiting'
       ORDER BY w.position ASC LIMIT 1`,
      [slot.desired_date, slot.desired_time]
    );
    if (!rows.length) continue;
    const entry = rows[0];
    const expiresAt = new Date(Date.now() + EXPIRY_MINUTES() * 60 * 1000);
    await pool.query(
      `UPDATE waitlist SET status='notified', notified_at=NOW(), expires_at=$1 WHERE id=$2`,
      [expiresAt, entry.id]
    );
    const { sendMessage } = require('./twilioService');
    const msg = `¡Hola ${entry.name || 'cliente'}! 🎉 Hay disponibilidad el *${slot.desired_date}* a las *${slot.desired_time}*.\nResponde *SÍ* para confirmar. Tienes ${EXPIRY_MINUTES()} minutos.`;
    await sendMessage(entry.phone, msg).catch((e) =>
      console.error('waitlist renotify error:', e.message)
    );
  }
}

module.exports = { addToWaitlist, notifyWaitlist, expireAndRenotify };
