const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/availabilityController');

router.use(requireAuth);
router.get('/', c.getSchedule);
router.put('/', c.setSchedule);
router.get('/blocked', c.getBlocked);
router.post('/blocked', c.addBlocked);
router.delete('/blocked/:id', c.removeBlocked);

module.exports = router;
