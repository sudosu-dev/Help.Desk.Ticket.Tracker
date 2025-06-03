// db/index.ts was calling .env before app.ts and causing
// errors so moved dotenv import and config call to here
import dotenv from 'dotenv';
dotenv.config();

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
