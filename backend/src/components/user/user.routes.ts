// backend/src/components/user/user.routes.ts

import { Router } from 'express';
import { validate } from '../../core/middleware/validation.middleware';
import {
  handleCreateUserByAdmin,
  handleGetAllUsers,
  handleGetUserById,
  handleUpdateUserById,
} from './user.controller';
import {
  createUserByAdminSchema,
  getUserByIdSchema,
  updateUserSchema,
} from './user.validation';

const router = Router();

// Routes for user management by admin

// Create a user
router.post('/', validate(createUserByAdminSchema), handleCreateUserByAdmin);

// Get all users
router.get('/', handleGetAllUsers);

// Get user by ID
router.get('/:userId', validate(getUserByIdSchema), handleGetUserById);

// Update user by ID
router.put('/:userId', validate(updateUserSchema), handleUpdateUserById);

// We will add GET, PUT, and DELETE routes for users here later.

export default router;
