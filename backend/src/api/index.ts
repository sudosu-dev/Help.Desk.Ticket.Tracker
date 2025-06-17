import { Router } from 'express';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import ticketRoutes from '../components/tickets/tickets.routes';
import { topLevelRouter as commentRoutes } from '../components/comments/comments.routes';

const router = Router();

// API V1 root route
router.get('/', (req, res) => {
  res
    .status(200)
    .json({ message: 'API V1 is alive and main router is working!' });
});

// Resource specific routes
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/tickets', ticketRoutes);
router.use('/comments', commentRoutes);
// TODO: Import and use other resource-specific routes here

export default router;
