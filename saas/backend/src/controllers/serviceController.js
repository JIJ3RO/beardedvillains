const pool = require('../config/database');

async function list(req, res, next) {
  try {
    const { rows } = await pool.query('SELECT * FROM services ORDER BY name');
    res.json({ services: rows });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { name, duration_minutes, price, home_visit_surcharge = 0 } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO services(name,duration_minutes,price,home_visit_surcharge) VALUES($1,$2,$3,$4) RETURNING *',
      [name, duration_minutes, price, home_visit_surcharge]
    );
    res.status(201).json({ service: rows[0] });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { name, duration_minutes, price, home_visit_surcharge, is_active } = req.body;
    const { rows } = await pool.query(
      `UPDATE services SET name=COALESCE($1,name), duration_minutes=COALESCE($2,duration_minutes),
       price=COALESCE($3,price), home_visit_surcharge=COALESCE($4,home_visit_surcharge),
       is_active=COALESCE($5,is_active), updated_at=NOW()
       WHERE id=$6 RETURNING *`,
      [name, duration_minutes, price, home_visit_surcharge, is_active, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ service: rows[0] });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await pool.query('UPDATE services SET is_active=false, updated_at=NOW() WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
}

module.exports = { list, create, update, remove };
