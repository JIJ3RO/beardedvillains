const pool = require('../config/database');

const definition = {
  name: 'list_services',
  description: 'Returns all active services with name, duration in minutes, price, and home visit surcharge.',
  input_schema: { type: 'object', properties: {}, required: [] },
};

async function execute(_input, _ctx) {
  const { rows } = await pool.query(
    'SELECT id, name, duration_minutes, price, home_visit_surcharge FROM services WHERE is_active=true ORDER BY name'
  );
  return { services: rows };
}

module.exports = { definition, execute };
