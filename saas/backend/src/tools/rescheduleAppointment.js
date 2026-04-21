const { rescheduleAppointment } = require('../services/appointmentService');

const definition = {
  name: 'reschedule_appointment',
  description: 'Moves an existing appointment to a new date and time.',
  input_schema: {
    type: 'object',
    properties: {
      appointment_id: { type: 'string' },
      new_date: { type: 'string', description: 'YYYY-MM-DD local' },
      new_time: { type: 'string', description: 'HH:MM 24h local' },
    },
    required: ['appointment_id', 'new_date', 'new_time'],
  },
};

async function execute(input, ctx) {
  return rescheduleAppointment(input.appointment_id, input.new_date, input.new_time, ctx.clientIsVip);
}

module.exports = { definition, execute };
