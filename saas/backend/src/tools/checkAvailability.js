const pool = require('../config/database');
const { getAvailableSlots } = require('../services/availabilityService');

const definition = {
  name: 'check_availability',
  description:
    'Returns available time slots for a given service and date. Home visit and Sundays are only available for VIP clients.',
  input_schema: {
    type: 'object',
    properties: {
      service_id: { type: 'string', description: 'UUID of the service' },
      date: { type: 'string', description: 'Date in YYYY-MM-DD format (local timezone)' },
      appointment_type: {
        type: 'string',
        enum: ['in_shop', 'home_visit'],
        description: 'Whether the appointment is in-shop or at home',
      },
    },
    required: ['service_id', 'date'],
  },
};

async function execute(input, ctx) {
  const { service_id, date, appointment_type = 'in_shop' } = input;

  if (appointment_type === 'home_visit' && !ctx.clientIsVip) {
    return { available_slots: [], message: 'El servicio a domicilio es exclusivo para clientes VIP.' };
  }

  const { rows } = await pool.query(
    'SELECT duration_minutes FROM services WHERE id=$1 AND is_active=true',
    [service_id]
  );
  if (!rows.length) return { error: 'Servicio no encontrado.' };

  const slots = await getAvailableSlots(date, rows[0].duration_minutes, ctx.clientIsVip);
  if (!slots.length) return { available_slots: [], message: 'No hay horarios disponibles ese día.' };
  return { available_slots: slots };
}

module.exports = { definition, execute };
