/**
 * Server Entry Point
 *
 * Main server initialization file that bootstraps the Express application,
 * creates the HTTP server, and establishes database connectivity. This file
 * serves as the application's entry point and handles server startup logic.
 *
 * Responsibilities:
 * - Creates and configures the HTTP server using the Express app
 * - Manages server startup with configurable port from environment variables
 * - Performs database connection health check on startup
 * - Provides startup logging for debugging and monitoring
 * - Displays current environment configuration
 *
 * Health checks:
 * - Tests PostgreSQL database connectivity on server start
 * - Logs connection status for operational visibility
 * - Gracefully handles database connection failures
 *
 * Environment configuration:
 * - Uses PORT environment variable or defaults to 8000
 * - Displays current NODE_ENV for environment awareness
 *
 * @file backend/src/server.ts
 */

import app from './app';
import http from 'http';
import pool from './core/db';

// Get port from environment variables or default to 8000
const PORT: string | number = process.env.PORT || 8000;

// Create an HTTP server
const server = http.createServer(app);

// Start the server
server.listen(PORT, async () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
  console.log(`Current environment: ${process.env.NODE_ENV || 'development'}`);
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log(
      '+++ [SERVER] DB Connection Test Successful! PostgreSQL current time:',
      result.rows[0].now
    );
    client.release();
  } catch (error) {
    console.error('!!! [SERVER] DB Connection Test Failed on startup:', error);
  }
});
