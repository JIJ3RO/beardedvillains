const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/appointmentController');

router.use(requireAuth);
router.get('/', c.list);
router.patch('/:id/status', c.updateStatus);
router.delete('/:id', c.cancel);

module.exports = router;
