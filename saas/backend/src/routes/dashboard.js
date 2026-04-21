const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const pool = require('../config/database');

router.use(requireAuth);

router.get('/stats', async (req, res, next) => {
  try {
    const [today, week, cancelled, lowStock, waitingCount] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) FROM appointments WHERE status='confirmed' AND scheduled_at::date = CURRENT_DATE`
      ),
      pool.query(
        `SELECT COUNT(*) FROM appointments WHERE status='confirmed'
         AND scheduled_at >= date_trunc('week', NOW()) AND scheduled_at < date_trunc('week', NOW()) + interval '7 days'`
      ),
      pool.query(
        `SELECT COUNT(*) FROM appointments WHERE status='cancelled'
         AND updated_at >= NOW() - interval '30 days'`
      ),
      pool.query(
        `SELECT id, name, stock FROM products WHERE stock <= 5 AND is_active=true ORDER BY stock ASC`
      ),
      pool.query(`SELECT COUNT(*) FROM waitlist WHERE status='waiting'`),
    ]);

    res.json({
      today: parseInt(today.rows[0].count),
      this_week: parseInt(week.rows[0].count),
      cancellations_30d: parseInt(cancelled.rows[0].count),
      low_stock_products: lowStock.rows,
      waitlist_count: parseInt(waitingCount.rows[0].count),
    });
  } catch (err) { next(err); }
});

module.exports = router;
