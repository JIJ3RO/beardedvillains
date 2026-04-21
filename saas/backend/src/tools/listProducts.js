const pool = require('../config/database');

const definition = {
  name: 'list_products',
  description: 'Returns products available for sale. Optionally filter by category.',
  input_schema: {
    type: 'object',
    properties: {
      category: { type: 'string', description: 'Optional category filter e.g. "Cera", "Herramienta"' },
    },
    required: [],
  },
};

async function execute(input, _ctx) {
  const { category } = input;
  const { rows } = category
    ? await pool.query(
        'SELECT id, name, description, price, stock, category FROM products WHERE is_active=true AND category=$1 ORDER BY name',
        [category]
      )
    : await pool.query(
        'SELECT id, name, description, price, stock, category FROM products WHERE is_active=true ORDER BY category, name'
      );
  return { products: rows };
}

module.exports = { definition, execute };
