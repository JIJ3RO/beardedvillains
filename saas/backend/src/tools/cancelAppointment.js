const { cancelAppointment } = require('../services/appointmentService');

const definition = {
  name: 'cancel_appointment',
  description: "Cancels one of the customer's confirmed appointments.",
  input_schema: {
    type: 'object',
    properties: {
      appointment_id: { type: 'string', description: 'UUID of the appointment to cancel' },
    },
    required: ['appointment_id'],
  },
};

async function execute(input, _ctx) {
  return cancelAppointment(input.appointment_id, 'client');
}

module.exports = { definition, execute };
