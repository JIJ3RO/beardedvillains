const { addToWaitlist } = require('../services/waitlistService');

const definition = {
  name: 'join_waitlist',
  description:
    'Adds the customer to the waitlist for a specific slot that is currently full. They will be notified automatically if it opens.',
  input_schema: {
    type: 'object',
    properties: {
      service_id: { type: 'string' },
      desired_date: { type: 'string', description: 'YYYY-MM-DD local' },
      desired_time: { type: 'string', description: 'HH:MM 24h local' },
    },
    required: ['service_id', 'desired_date', 'desired_time'],
  },
};

async function execute(input, ctx) {
  const { position } = await addToWaitlist(
    ctx.clientId,
    input.service_id,
    input.desired_date,
    input.desired_time
  );
  return {
    success: true,
    message: `Te agregué a la lista de espera. Eres el #${position} en la fila para ese horario. Te avisaré por WhatsApp si se libera un lugar.`,
  };
}

module.exports = { definition, execute };
