const twilioClient = require('../config/twilio');

async function sendMessage(toPhone, body) {
  const from = process.env.TWILIO_WHATSAPP_NUMBER;
  const to = toPhone.startsWith('whatsapp:') ? toPhone : `whatsapp:${toPhone}`;
  const msg = await twilioClient.messages.create({ from, to, body });
  return msg.sid;
}

module.exports = { sendMessage };
