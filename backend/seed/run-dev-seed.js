// run-dev-seed.js — executes dev-seed.sql via the existing pg connection.
// Uses DATABASE_URL from the environment (same as the app).
// Run via: docker compose exec app npm run seed:dev

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const sql = fs.readFileSync(path.join(__dirname, 'dev-seed.sql'), 'utf8');

pool.query(sql)
  .then(() => {
    console.log('Dev seed applied.');
    pool.end();
  })
  .catch((err) => {
    console.error('Seed failed:', err.message);
    pool.end();
    process.exit(1);
  });
