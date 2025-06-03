import { Router, Request, Response } from 'express';
import {
  handleUserRegistration,
  handleUserLogin,
  handleuserLogout,
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

// TODO: Add other routes later (/refresh-token, /forgot-password, /reset-password)

export default router;
