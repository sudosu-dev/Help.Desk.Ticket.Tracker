// backend/src/server.ts
import app from './app';
import http from 'http';

// Get port from environment variables or default to 8000
const PORT: string | number = process.env.PORT || 8000;

// Create an HTTP server
const server = http.createServer(app);

// Start the server
server.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
  console.log(`Current environment: ${process.env.NODE_ENV || 'development'}`);
});
