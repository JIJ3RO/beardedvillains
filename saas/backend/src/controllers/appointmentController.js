const pool = require('../config/database');
const { cancelAppointment } = require('../services/appointmentService');

async function list(req, res, next) {
  try {
    const { date, status, type, page = 1, limit = 20 } = req.query;
    const conditions = [];
    const params = [];

    if (date) {
      conditions.push(`a.scheduled_at::date = $${params.push(date)}`);
    }
    if (status) {
      conditions.push(`a.status = $${params.push(status)}`);
    }
    if (type) {
      conditions.push(`a.type = $${params.push(type)}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const { rows } = await pool.query(
      `SELECT a.id, a.scheduled_at, a.ends_at, a.type, a.status, a.address, a.home_visit_fee,
              c.name as client_name, c.phone as client_phone, c.is_vip,
              c.cancellation_count, c.noshow_count,
              s.name as service_name, s.price
       FROM appointments a
       JOIN clients c ON c.id = a.client_id
       JOIN services s ON s.id = a.service_id
       ${where}
       ORDER BY a.scheduled_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({ appointments: rows });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['confirmed', 'cancelled', 'completed', 'no_show'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    if (status === 'no_show') {
      const { rows } = await pool.query('SELECT client_id FROM appointments WHERE id=$1', [id]);
      if (rows.length) {
        await pool.query(
          'UPDATE clients SET noshow_count=noshow_count+1, updated_at=NOW() WHERE id=$1',
          [rows[0].client_id]
        );
      }
    }

    const { rows } = await pool.query(
      `UPDATE appointments SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
      [status, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Appointment not found' });
    res.json({ appointment: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function cancel(req, res, next) {
  try {
    const result = await cancelAppointment(req.params.id, 'barber');
    if (!result.success) return res.status(404).json({ error: result.reason });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, updateStatus, cancel };
