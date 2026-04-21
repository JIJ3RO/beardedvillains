const pool = require('../config/database');
const { localToUTC, formatLocal } = require('../utils/dateUtils');
const { addMinutes } = require('date-fns');
const { getAvailableSlots } = require('./availabilityService');
const { notifyWaitlist } = require('./waitlistService');

async function createAppointment({ clientId, serviceId, date, time, type, address }) {
  const { rows: svcRows } = await pool.query(
    'SELECT * FROM services WHERE id = $1 AND is_active = true',
    [serviceId]
  );
  if (!svcRows.length) throw Object.assign(new Error('Service not found'), { status: 400 });

  const svc = svcRows[0];
  const scheduledAt = localToUTC(date, time);
  const endsAt = addMinutes(scheduledAt, svc.duration_minutes);
  const homeVisitFee = type === 'home_visit' ? Number(svc.home_visit_surcharge) : 0;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Re-check availability inside transaction
    const slots = await getAvailableSlots(date, svc.duration_minutes, true);
    if (!slots.includes(time)) {
      await client.query('ROLLBACK');
      return { success: false, reason: 'Ese horario ya no está disponible.' };
    }

    const { rows } = await client.query(
      `INSERT INTO appointments
         (client_id, service_id, scheduled_at, ends_at, type, address, home_visit_fee)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [clientId, serviceId, scheduledAt, endsAt, type, address || null, homeVisitFee]
    );

    await client.query('COMMIT');
    const appt = rows[0];
    return {
      success: true,
      appointment_id: appt.id,
      confirmation_message: buildConfirmMsg(appt, svc, homeVisitFee),
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function cancelAppointment(appointmentId, cancelledBy = 'client') {
  const { rows } = await pool.query(
    `UPDATE appointments SET status='cancelled', cancelled_by=$2, updated_at=NOW()
     WHERE id=$1 AND status='confirmed' RETURNING *`,
    [appointmentId, cancelledBy]
  );
  if (!rows.length) return { success: false, reason: 'Cita no encontrada o ya cancelada.' };

  const appt = rows[0];
  // Increment cancellation counter for client-initiated cancellations
  if (cancelledBy === 'client') {
    await pool.query(
      'UPDATE clients SET cancellation_count = cancellation_count+1, updated_at=NOW() WHERE id=$1',
      [appt.client_id]
    );
  }

  // Notify waitlist asynchronously
  notifyWaitlist(appt).catch((e) => console.error('waitlist notify error:', e.message));

  return { success: true, message: 'Cita cancelada correctamente.' };
}

async function rescheduleAppointment(appointmentId, newDate, newTime, clientIsVip) {
  const { rows: apptRows } = await pool.query(
    'SELECT * FROM appointments WHERE id=$1 AND status=$2',
    [appointmentId, 'confirmed']
  );
  if (!apptRows.length) return { success: false, reason: 'Cita no encontrada.' };

  const appt = apptRows[0];
  const { rows: svcRows } = await pool.query('SELECT * FROM services WHERE id=$1', [appt.service_id]);
  const svc = svcRows[0];

  const slots = await getAvailableSlots(newDate, svc.duration_minutes, clientIsVip);
  if (!slots.includes(newTime)) {
    return { success: false, reason: 'Ese nuevo horario no está disponible.' };
  }

  const newScheduledAt = localToUTC(newDate, newTime);
  const newEndsAt = addMinutes(newScheduledAt, svc.duration_minutes);

  const { rows } = await pool.query(
    `UPDATE appointments
     SET scheduled_at=$1, ends_at=$2, reminder_24h_sent=false, reminder_1h_sent=false, updated_at=NOW()
     WHERE id=$3 RETURNING *`,
    [newScheduledAt, newEndsAt, appointmentId]
  );

  return {
    success: true,
    appointment_id: rows[0].id,
    confirmation_message: `Cita reagendada para el ${formatLocal(newScheduledAt)}. ¡Te esperamos!`,
  };
}

async function getClientAppointments(clientId, status = 'confirmed') {
  const query = status === 'all'
    ? 'SELECT a.*, s.name as service_name FROM appointments a JOIN services s ON s.id=a.service_id WHERE a.client_id=$1 ORDER BY a.scheduled_at DESC LIMIT 10'
    : `SELECT a.*, s.name as service_name FROM appointments a JOIN services s ON s.id=a.service_id WHERE a.client_id=$1 AND a.status='confirmed' AND a.scheduled_at > NOW() ORDER BY a.scheduled_at ASC`;

  const { rows } = await pool.query(query, [clientId]);
  return rows.map((r) => ({
    id: r.id,
    service_name: r.service_name,
    scheduled_at_local: formatLocal(r.scheduled_at),
    type: r.type,
    status: r.status,
  }));
}

function buildConfirmMsg(appt, svc, homeVisitFee) {
  const total = Number(svc.price) + homeVisitFee;
  let msg = `✅ Cita confirmada!\n📅 ${formatLocal(appt.scheduled_at)}\n✂️ ${svc.name}\n💰 $${total}`;
  if (appt.type === 'home_visit') msg += `\n🏠 Domicilio: ${appt.address}\n(incluye cargo por traslado: $${homeVisitFee})`;
  msg += '\n\nRecuerda que recibirás un recordatorio 24h y 1h antes.';
  return msg;
}

module.exports = { createAppointment, cancelAppointment, rescheduleAppointment, getClientAppointments };
