const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/productController');

router.use(requireAuth);
router.get('/', c.list);
router.post('/', c.create);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

module.exports = router;
