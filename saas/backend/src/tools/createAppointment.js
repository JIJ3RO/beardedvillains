const { createAppointment } = require('../services/appointmentService');

const definition = {
  name: 'create_appointment',
  description:
    'Books an appointment after the customer has confirmed all details (service, date, time, type). For home visits, address is required.',
  input_schema: {
    type: 'object',
    properties: {
      service_id: { type: 'string' },
      date: { type: 'string', description: 'YYYY-MM-DD local' },
      time: { type: 'string', description: 'HH:MM 24h local' },
      appointment_type: { type: 'string', enum: ['in_shop', 'home_visit'], default: 'in_shop' },
      address: { type: 'string', description: 'Required if appointment_type is home_visit' },
    },
    required: ['service_id', 'date', 'time'],
  },
};

async function execute(input, ctx) {
  const { service_id, date, time, appointment_type = 'in_shop', address } = input;

  if (appointment_type === 'home_visit' && !ctx.clientIsVip) {
    return { success: false, reason: 'El servicio a domicilio es exclusivo para clientes VIP.' };
  }
  if (appointment_type === 'home_visit' && !address) {
    return { success: false, reason: 'Necesito la dirección para el servicio a domicilio.' };
  }

  return createAppointment({
    clientId: ctx.clientId,
    serviceId: service_id,
    date,
    time,
    type: appointment_type,
    address,
  });
}

module.exports = { definition, execute };
