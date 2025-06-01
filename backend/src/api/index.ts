// backend/src/api/index.ts
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
