const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const pool = require('../config/database');

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const { date } = req.query;
    const query = date
      ? `SELECT w.*, c.name, c.phone, s.name as service_name
         FROM waitlist w JOIN clients c ON c.id=w.client_id JOIN services s ON s.id=w.service_id
         WHERE w.desired_date=$1 AND w.status='waiting' ORDER BY w.desired_time, w.position`
      : `SELECT w.*, c.name, c.phone, s.name as service_name
         FROM waitlist w JOIN clients c ON c.id=w.client_id JOIN services s ON s.id=w.service_id
         WHERE w.status='waiting' ORDER BY w.desired_date, w.desired_time, w.position`;
    const { rows } = await pool.query(query, date ? [date] : []);
    res.json({ waitlist: rows });
  } catch (err) { next(err); }
});

module.exports = router;
