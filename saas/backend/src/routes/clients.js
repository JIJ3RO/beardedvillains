const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/clientController');

router.use(requireAuth);
router.get('/', c.list);
router.patch('/:id', c.update);

module.exports = router;
