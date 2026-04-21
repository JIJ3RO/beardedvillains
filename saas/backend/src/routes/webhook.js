const router = require('express').Router();
const { validateTwilioWebhook } = require('../middleware/validateWebhook');
const { receive } = require('../controllers/webhookController');

router.post('/whatsapp', validateTwilioWebhook, receive);
router.get('/whatsapp', (_req, res) => res.send('Webhook OK'));

module.exports = router;
