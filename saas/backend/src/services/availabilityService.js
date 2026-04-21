const pool = require('../config/database');
const { localToUTC, formatLocal } = require('../utils/dateUtils');
const { addMinutes, parseISO, format } = require('date-fns');
const { toZonedTime } = require('date-fns-tz');

const TZ = () => process.env.BARBER_TIMEZONE || 'America/Mexico_City';
const SLOT_INTERVAL = 30; // minutes between slot start times

/**
 * Returns available time slots for a given date.
 * Filters out slots blocked by existing appointments or blocked_slots.
 * If vip_only day, clientIsVip must be true.
 */
async function getAvailableSlots(dateStr, serviceDuration, clientIsVip = false) {
  const date = parseISO(dateStr);
  const dayOfWeek = date.getDay(); // 0=Sun

  // Get barber schedule for this day
  const { rows: schedRows } = await pool.query(
    'SELECT * FROM availability WHERE day_of_week = $1',
    [dayOfWeek]
  );

  if (schedRows.length === 0) return [];

  const sched = schedRows[0];
  if (sched.vip_only && !clientIsVip) return [];

  // Build candidate slot times (every SLOT_INTERVAL minutes)
  const [startH, startM] = sched.start_time.split(':').map(Number);
  const [endH, endM] = sched.end_time.split(':').map(Number);

  const slots = [];
  let cursor = new Date(date);
  cursor.setHours(startH, startM, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(endH, endM, 0, 0);

  while (cursor < dayEnd) {
    const slotEnd = addMinutes(cursor, serviceDuration);
    if (slotEnd > dayEnd) break;
    slots.push(new Date(cursor));
    cursor = addMinutes(cursor, SLOT_INTERVAL);
  }

  // Convert slot local-time objects to UTC for conflict queries
  const utcSlots = slots.map((s) => {
    const timeStr = format(s, 'HH:mm');
    return localToUTC(dateStr, timeStr);
  });

  // Fetch conflicting confirmed appointments
  const dayStartUTC = localToUTC(dateStr, '00:00');
  const dayEndUTC = localToUTC(dateStr, '23:59');
  const { rows: appts } = await pool.query(
    `SELECT scheduled_at, ends_at FROM appointments
     WHERE status = 'confirmed'
     AND scheduled_at >= $1 AND scheduled_at <= $2`,
    [dayStartUTC, dayEndUTC]
  );

  // Fetch blocked slots
  const { rows: blocked } = await pool.query(
    `SELECT start_at, end_at FROM blocked_slots
     WHERE start_at <= $2 AND end_at >= $1`,
    [dayStartUTC, dayEndUTC]
  );

  const conflicts = [...appts, ...blocked];

  function overlaps(slotStart, slotEnd) {
    return conflicts.some((c) => {
      const cs = new Date(c.scheduled_at || c.start_at);
      const ce = new Date(c.ends_at || c.end_at);
      return slotStart < ce && slotEnd > cs;
    });
  }

  // Filter out conflicting slots and past times
  const now = new Date();
  return utcSlots
    .filter((utcStart) => {
      if (utcStart <= now) return false;
      const utcEnd = addMinutes(utcStart, serviceDuration);
      return !overlaps(utcStart, utcEnd);
    })
    .map((utcStart) => {
      const local = toZonedTime(utcStart, TZ());
      return format(local, 'HH:mm');
    });
}

module.exports = { getAvailableSlots };
