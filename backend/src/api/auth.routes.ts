import { Router, Request, Response } from 'express';
import {
  handleUserRegistration,
  handleUserLogin,
  handleuserLogout,
  handleRequestPasswordReset,
  handleResetPassword,
} from '../components/auth/auth.controller';

// import * as AuthController from '../components/auth/auth.controller';

const router = Router();

// User Registration Route
// POST /api/v1/auth/register
router.post('/register', handleUserRegistration);

// User Login Route
// POST /api/v1/auth/login
router.post('/login', handleUserLogin);

// User Logout Route
// POST /api/v1/auth/logout
router.post('/logout', handleuserLogout);

// Forgot Password Route
// POST /api/v1/auth/forgot-password
router.post('/forgot-password', handleRequestPasswordReset);

// Reset Password Route
// POST /api/v1/auth/reset-password
router.post('/reset-password', handleResetPassword);

// TODO: Add other routes later (/refresh-token, /reset-password)

export default router;
