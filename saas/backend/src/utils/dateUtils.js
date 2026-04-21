const { toZonedTime, fromZonedTime, format } = require('date-fns-tz');
const { addMinutes } = require('date-fns');

const TZ = () => process.env.BARBER_TIMEZONE || 'America/Mexico_City';

function nowInTZ() {
  return toZonedTime(new Date(), TZ());
}

function localToUTC(dateStr, timeStr) {
  // dateStr: 'YYYY-MM-DD', timeStr: 'HH:MM'
  const localISO = `${dateStr}T${timeStr}:00`;
  return fromZonedTime(localISO, TZ());
}

function utcToLocal(date) {
  return toZonedTime(date, TZ());
}

function formatLocal(date, fmt = 'dd/MM/yyyy HH:mm') {
  return format(toZonedTime(date, TZ()), fmt, { timeZone: TZ() });
}

function addMins(date, minutes) {
  return addMinutes(date, minutes);
}

module.exports = { nowInTZ, localToUTC, utcToLocal, formatLocal, addMins, TZ };
