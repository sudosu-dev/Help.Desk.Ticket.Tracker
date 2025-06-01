/**
 * Database Connection Pool
 *
 * Configures and exports a PostgreSQL connection pool using the `pg` library.
 * This module establishes the primary database connection that will be shared
 * across the entire application, providing efficient connection management
 * and automatic connection pooling.
 *
 * Configuration:
 * - Uses environment variables for all database connection parameters
 * - Defaults to PostgreSQL standard port 5432 if DB_PORT is not specified
 * - Leverages pg.Pool for automatic connection pooling and management
 *
 * Connection monitoring:
 * - Logs successful connections for operational visibility
 * - Handles and logs unexpected errors on idle connections
 * - Provides connection lifecycle event handling
 *
 * Environment variables required:
 * - DB_USER: PostgreSQL username
 * - DB_HOST: Database server hostname/IP
 * - DB_NAME: Target database name
 * - DB_PASSWORD: Database user password
 * - DB_PORT: Database port (optional, defaults to 5432)
 *
 * This pool instance is imported throughout the application for all
 * database operations, ensuring consistent connection management.
 *
 * @file backend/src/core/db/index.ts
 */

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
