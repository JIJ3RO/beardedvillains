const pool = require('../config/database');

async function getSchedule(req, res, next) {
  try {
    const { rows } = await pool.query('SELECT * FROM availability ORDER BY day_of_week');
    res.json({ schedule: rows });
  } catch (err) { next(err); }
}

async function setSchedule(req, res, next) {
  try {
    const { schedule } = req.body; // array of {day_of_week, start_time, end_time, vip_only}
    if (!Array.isArray(schedule)) return res.status(400).json({ error: 'schedule must be array' });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM availability');
      for (const s of schedule) {
        await client.query(
          'INSERT INTO availability(day_of_week,start_time,end_time,vip_only) VALUES($1,$2,$3,$4)',
          [s.day_of_week, s.start_time, s.end_time, s.vip_only || false]
        );
      }
      await client.query('COMMIT');
      res.json({ success: true });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) { next(err); }
}

async function getBlocked(req, res, next) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM blocked_slots WHERE end_at > NOW() ORDER BY start_at'
    );
    res.json({ blocked: rows });
  } catch (err) { next(err); }
}

async function addBlocked(req, res, next) {
  try {
    const { start_at, end_at, reason } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO blocked_slots(start_at,end_at,reason) VALUES($1,$2,$3) RETURNING *',
      [start_at, end_at, reason]
    );
    res.status(201).json({ blocked: rows[0] });
  } catch (err) { next(err); }
}

async function removeBlocked(req, res, next) {
  try {
    await pool.query('DELETE FROM blocked_slots WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
}

module.exports = { getSchedule, setSchedule, getBlocked, addBlocked, removeBlocked };
