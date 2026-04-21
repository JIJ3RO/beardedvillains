const pool = require('../config/database');

async function list(req, res, next) {
  try {
    const { rows } = await pool.query('SELECT * FROM products ORDER BY category, name');
    res.json({ products: rows });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { name, description, price, stock, category, image_url } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO products(name,description,price,stock,category,image_url) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',
      [name, description, price, stock || 0, category, image_url]
    );
    res.status(201).json({ product: rows[0] });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { name, description, price, stock, category, image_url, is_active } = req.body;
    const { rows } = await pool.query(
      `UPDATE products SET
         name=COALESCE($1,name), description=COALESCE($2,description),
         price=COALESCE($3,price), stock=COALESCE($4,stock),
         category=COALESCE($5,category), image_url=COALESCE($6,image_url),
         is_active=COALESCE($7,is_active), updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [name, description, price, stock, category, image_url, is_active, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ product: rows[0] });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await pool.query('UPDATE products SET is_active=false, updated_at=NOW() WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
}

module.exports = { list, create, update, remove };
