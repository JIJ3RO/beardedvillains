require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Admin user
    const hash = await bcrypt.hash('admin123', 10);
    await client.query(`
      INSERT INTO users(email, password_hash) VALUES($1, $2)
      ON CONFLICT(email) DO NOTHING
    `, ['admin@barbershop.com', hash]);

    // Services
    const services = [
      ['Corte clásico', 30, 150, 50],
      ['Fade / degradado', 45, 200, 50],
      ['Barba', 20, 100, 50],
      ['Corte + Barba', 60, 250, 80],
    ];
    for (const [name, duration, price, surcharge] of services) {
      await client.query(`
        INSERT INTO services(name, duration_minutes, price, home_visit_surcharge)
        VALUES($1, $2, $3, $4) ON CONFLICT DO NOTHING
      `, [name, duration, price, surcharge]);
    }

    // Products
    const products = [
      ['Cera mate', 'Fijación fuerte sin brillo', 120, 25, 'Cera'],
      ['Pomada brillante', 'Acabado glossy clásico', 140, 18, 'Cera'],
      ['Peine de madera', 'Peine artesanal antiestático', 80, 30, 'Accesorio'],
      ['Máquina de corte profesional', 'Wahl Clipper inalámbrica', 1800, 5, 'Herramienta'],
      ['Aceite para barba', 'Hidratación y suavidad', 180, 20, 'Cuidado'],
    ];
    for (const [name, desc, price, stock, category] of products) {
      await client.query(`
        INSERT INTO products(name, description, price, stock, category)
        VALUES($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING
      `, [name, desc, price, stock, category]);
    }

    // Weekly availability (Mon-Sat 9am-7pm, Sunday VIP only 10am-3pm)
    const schedule = [
      [0, '10:00', '15:00', true],  // Sunday - VIP only
      [1, '09:00', '19:00', false], // Monday
      [2, '09:00', '19:00', false],
      [3, '09:00', '19:00', false],
      [4, '09:00', '19:00', false],
      [5, '09:00', '19:00', false],
      [6, '09:00', '17:00', false], // Saturday
    ];
    for (const [day, start, end, vip] of schedule) {
      await client.query(`
        INSERT INTO availability(day_of_week, start_time, end_time, vip_only)
        VALUES($1, $2, $3, $4) ON CONFLICT(day_of_week) DO UPDATE
        SET start_time=$2, end_time=$3, vip_only=$4
      `, [day, start, end, vip]);
    }

    // VIP test client
    await client.query(`
      INSERT INTO clients(phone, name, is_vip)
      VALUES('+5215512345678', 'Cliente VIP Test', true)
      ON CONFLICT(phone) DO NOTHING
    `);

    await client.query('COMMIT');
    console.log('Seed complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
