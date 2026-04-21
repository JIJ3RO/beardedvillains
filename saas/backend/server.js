require('dotenv').config();
const app = require('./src/app');
const pool = require('./src/config/database');
const { startScheduler } = require('./src/scheduler');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('DB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    if (process.env.NODE_ENV !== 'test') startScheduler();
  } catch (err) {
    console.error('Startup failed:', err.message);
    process.exit(1);
  }
}

start();
