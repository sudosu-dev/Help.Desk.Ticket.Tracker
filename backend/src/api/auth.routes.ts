import { Router, Request, Response } from 'express';
import {
  handleUserRegistration,
  handleUserLogin,
  handleUserLogout,
  handleRequestPasswordReset,
  handleResetPassword,
} from '../components/auth/auth.controller';
import { validate } from '../core/middleware/validation.middleware';
import {
  registerSchema,
  loginSchema,
} from '../components/auth/auth.validation';
import { authenticateToken } from '../core/middleware/auth.middleware';

// import * as AuthController from '../components/auth/auth.controller';

const router = Router();

// --- Public Routes ---
router.post('/register', validate(registerSchema), handleUserRegistration);
router.post('/login', validate(loginSchema), handleUserLogin);
router.post('/forgot-password', handleRequestPasswordReset);
router.post('/reset-password', handleResetPassword);

// --- Protected Routes ---
router.post('/logout', authenticateToken, handleUserLogout); // << USE authenticateToken here

export default router;
