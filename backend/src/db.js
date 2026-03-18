// This file may contain content made using generative AI. This comment satisfies requirements for this courses AI disclosure policys.
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'smartpark',
  user: process.env.DB_USER || 'smartpark',
  password: process.env.DB_PASSWORD || 'smartpark123',
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error', err);
  process.exit(-1);
});

module.exports = pool;
