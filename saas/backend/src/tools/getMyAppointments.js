const { getClientAppointments } = require('../services/appointmentService');

const definition = {
  name: 'get_my_appointments',
  description: "Fetches the customer's upcoming confirmed appointments.",
  input_schema: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['confirmed', 'all'],
        description: 'confirmed = only upcoming; all = full history',
      },
    },
    required: [],
  },
};

async function execute(input, ctx) {
  const appointments = await getClientAppointments(ctx.clientId, input.status || 'confirmed');
  if (!appointments.length) return { appointments: [], message: 'No tienes citas próximas.' };
  return { appointments };
}

module.exports = { definition, execute };
