// backend/src/api/admin.routes.ts

import { Router, Request, Response } from 'express';
import {
  authenticateToken,
  authorizeRoles,
} from '../core/middleware/auth.middleware';
import userRoutes from '../components/user/user.routes';

const router = Router();
const ADMIN_ROLE_ID = 1;

router.use(authenticateToken, authorizeRoles([ADMIN_ROLE_ID]));

// --- Mount resource-specific admin routes ---

router.use('/users', userRoutes);

// --- Standalone Admin Routes ---

router.get('/dashboard', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to the Admin Dashboard!',
    user: req.user,
  });
});

export default router;
