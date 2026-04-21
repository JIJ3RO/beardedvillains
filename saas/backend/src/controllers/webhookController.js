const { processMessage } = require('../services/claudeService');
const { sendMessage } = require('../services/twilioService');

async function receive(req, res) {
  // Twilio sends form-encoded body
  const from = req.body.From; // e.g. whatsapp:+5215512345678
  const body = (req.body.Body || '').trim();

  if (!from || !body) return res.status(200).send('<Response/>');

  // Normalize phone: strip 'whatsapp:' prefix
  const phone = from.replace('whatsapp:', '');

  // Respond 200 immediately to Twilio, process async
  res.status(200).send('<Response/>');

  try {
    const reply = await processMessage(phone, body);
    if (reply) await sendMessage(phone, reply);
  } catch (err) {
    console.error('Webhook processing error:', err.message);
    await sendMessage(phone, 'Ocurrió un error. Por favor intenta de nuevo en un momento.').catch(() => {});
  }
}

module.exports = { receive };
