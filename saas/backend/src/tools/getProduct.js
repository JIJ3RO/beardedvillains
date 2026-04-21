const pool = require('../config/database');

const definition = {
  name: 'get_product',
  description: 'Returns details of a single product by its ID.',
  input_schema: {
    type: 'object',
    properties: {
      product_id: { type: 'string', description: 'UUID of the product' },
    },
    required: ['product_id'],
  },
};

async function execute(input, _ctx) {
  const { rows } = await pool.query(
    'SELECT id, name, description, price, stock, category FROM products WHERE id=$1 AND is_active=true',
    [input.product_id]
  );
  if (!rows.length) return { error: 'Product not found' };
  return { product: rows[0] };
}

module.exports = { definition, execute };
