// backend/src/components/tickets/tickets.routes.ts

import { Router } from 'express';
import { authenticateToken } from '../../core/middleware/auth.middleware';
import { validate } from '../../core/middleware/validation.middleware';
import { createTicketSchema } from './tickets.validation';
import { handleCreateTicket } from './tickets.controller';

const router = Router();

router.post(
  '/',
  authenticateToken,
  validate(createTicketSchema),
  handleCreateTicket
);

export default router;
