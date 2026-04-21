const pool = require('../config/database');
const { sendMessage } = require('../services/twilioService');
const { formatLocal } = require('../utils/dateUtils');

async function sendReminders() {
  const now = new Date();

  const windows = [
    { type: '24h', flag: 'reminder_24h_sent', minOffset: 23 * 60 + 55, maxOffset: 24 * 60 + 5 },
    { type: '1h', flag: 'reminder_1h_sent', minOffset: 55, maxOffset: 65 },
  ];

  for (const w of windows) {
    const minTime = new Date(now.getTime() + w.minOffset * 60 * 1000);
    const maxTime = new Date(now.getTime() + w.maxOffset * 60 * 1000);

    const { rows } = await pool.query(
      `SELECT a.id, a.scheduled_at, a.type, a.address,
              c.phone, c.name,
              s.name as service_name
       FROM appointments a
       JOIN clients c ON c.id = a.client_id
       JOIN services s ON s.id = a.service_id
       WHERE a.status = 'confirmed'
         AND a.${w.flag} = false
         AND a.scheduled_at BETWEEN $1 AND $2`,
      [minTime, maxTime]
    );

    for (const appt of rows) {
      try {
        const timeStr = formatLocal(appt.scheduled_at);
        const typeNote = appt.type === 'home_visit' ? ' (servicio a domicilio)' : '';
        const msg =
          w.type === '24h'
            ? `¡Hola ${appt.name || 'cliente'}! 💈 Recordatorio: tienes una cita mañana a las *${timeStr}*${typeNote} para *${appt.service_name}*.\n\nSi necesitas cancelar o reagendar, escríbenos aquí.`
            : `¡Hola ${appt.name || 'cliente'}! ⏰ Tu cita es en *1 hora* (${timeStr})${typeNote}. ¡Te esperamos!`;

        const sid = await sendMessage(appt.phone, msg);
        await pool.query(
          `UPDATE appointments SET ${w.flag}=true, updated_at=NOW() WHERE id=$1`,
          [appt.id]
        );
        await pool.query(
          `INSERT INTO reminder_logs(appointment_id, type, twilio_sid, status) VALUES($1,$2,$3,'sent')`,
          [appt.id, w.type, sid]
        );
      } catch (err) {
        console.error(`Reminder ${w.type} failed for appt ${appt.id}:`, err.message);
        await pool.query(
          `INSERT INTO reminder_logs(appointment_id, type, status) VALUES($1,$2,'failed')`,
          [appt.id, w.type]
        );
      }
    }
  }
}

module.exports = { sendReminders };
