const twilio = require('twilio');

function validateTwilioWebhook(req, res, next) {
  if (process.env.NODE_ENV === 'test') return next();

  const signature = req.headers['x-twilio-signature'];
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const valid = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN,
    signature,
    url,
    req.body
  );
  if (!valid) return res.status(403).send('Forbidden');
  next();
}

module.exports = { validateTwilioWebhook };
