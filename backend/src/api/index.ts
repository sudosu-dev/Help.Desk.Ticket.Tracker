/**
 * API Routes Index
 *
 * Central routing hub that aggregates and mounts all API route modules.
 * This file serves as the main entry point for all API endpoints, providing
 * a clean separation of concerns and modular route organization.
 *
 * Current functionality:
 * - Provides a health check endpoint at the root API path
 * - Mounts authentication routes under '/auth' prefix
 * - Exports a single router instance for the main application
 *
 * Route structure:
 * - GET /api/v1/ - API health check endpoint
 * - /api/v1/auth/* - Authentication-related endpoints
 *
 * Future expansions:
 * - Will mount additional resource routes (users, tickets, comments, etc.)
 * - Each feature will have its own route module imported and mounted here
 * - Maintains clean URL structure with logical grouping
 *
 * This modular approach allows for:
 * - Easy addition of new route modules
 * - Clear separation of different API concerns
 * - Centralized route management and organization
 * - Consistent API versioning and structure
 *
 * @file backend/src/api/index.ts
 */

import { Router } from 'express';
import authRoutes from './auth.routes';

const router = Router();

// Placeholder: Test route for the main API endpoint
router.get('/', (req, res) => {
  res.status(200).json({ message: 'API V1 is alive!' });
});

// Mount Auth routes
router.use('/auth', authRoutes);

// TODO: Import and use other resource-specific routes here

export default router;
