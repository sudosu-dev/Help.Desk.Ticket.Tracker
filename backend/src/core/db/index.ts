// backend/src/core/db/index.ts
import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

// Test connection and log any errors during pool creation or connection
pool.on('connect', () => {
  console.log('Successfully connected to the PostgreSQL database pool');
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  //   process.exit(-1);
});

export default pool;
