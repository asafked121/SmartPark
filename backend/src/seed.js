// This file may contain content made using generative AI. This comment satisfies requirements for this courses AI disclosure policys.
const bcrypt = require('bcrypt');
const pool = require('./db');

async function seed() {
  try {
    const existing = await pool.query("SELECT user_id FROM users WHERE email = 'admin@smartpark.com'");
    if (existing.rows.length > 0) return;

    const hash = await bcrypt.hash('admin123', 10);
    await pool.query(
      "INSERT INTO users (email, password_hash, role) VALUES ('admin@smartpark.com', $1, 'admin')",
      [hash]
    );
    console.log('Seeded admin user: admin@smartpark.com / admin123');
  } catch (err) {
    // Table might not exist yet on first run; ignore
    console.error('Seed skipped:', err.message);
  }
}

module.exports = seed;
