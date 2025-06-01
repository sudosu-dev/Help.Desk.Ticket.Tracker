/**
 * Express Application Configuration
 *
 * Main Express application setup and configuration file that defines the core
 * middleware stack, routing structure, and application-level settings. This file
 * creates the Express app instance that will be used by the HTTP server.
 *
 * Middleware stack:
 * - CORS: Enables cross-origin requests for frontend integration
 * - JSON Parser: Handles incoming JSON request bodies
 * - URL-encoded Parser: Processes form-encoded request data
 * - Environment Variables: Loads configuration from .env file
 *
 * Routing structure:
 * - Mounts all API routes under '/api/v1' prefix for versioning
 * - Provides clean separation between API versions
 * - Centralized route management through api router
 *
 * Current features:
 * - Basic middleware configuration for typical REST API needs
 * - API versioning support with v1 prefix
 * - Environment-based configuration loading
 *
 * Future enhancements:
 * - Global error handling middleware for consistent error responses
 * - Request logging and monitoring middleware
 * - Rate limiting and security middleware
 * - Authentication middleware integration
 *
 * This app instance is imported by server.ts to create the HTTP server.
 *
 * @file backend/src/app.ts
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import apiRouterV1 from './api';

const app: Application = express();

// Core middleware
// Enable CORS - Cross-Origin Resource Sharing
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Simple Root Route for testing
// app.get('/', (req: Request, res: Response) => {
//   res.status(200).json({
//     message: 'Welcome to the Help Desk API!',
//     timeStamp: new Date().toISOString(),
//   });
// });

// Mount API routes
app.use('/api/v1', apiRouterV1);

// TODO: Add Global Error Handling Middleware
// app.use((err: Error, req: Request, res: Response, next: NextFunction) => {});

export default app;
