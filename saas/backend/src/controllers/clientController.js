const pool = require('../config/database');

async function list(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT id, phone, name, is_vip, cancellation_count, noshow_count, notes, created_at
       FROM clients ORDER BY created_at DESC`
    );
    res.json({ clients: rows });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { is_vip, notes, name } = req.body;
    const fields = [];
    const params = [];
    if (is_vip !== undefined) fields.push(`is_vip=$${params.push(is_vip)}`);
    if (notes !== undefined) fields.push(`notes=$${params.push(notes)}`);
    if (name !== undefined) fields.push(`name=$${params.push(name)}`);
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    fields.push(`updated_at=NOW()`);
    params.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE clients SET ${fields.join(',')} WHERE id=$${params.length} RETURNING *`,
      params
    );
    if (!rows.length) return res.status(404).json({ error: 'Client not found' });
    res.json({ client: rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, update };
