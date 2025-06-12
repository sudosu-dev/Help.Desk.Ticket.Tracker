// backend/src/components/tickets/tickets.routes.ts

import { Router } from 'express';
import { authenticateToken } from '../../core/middleware/auth.middleware';
import { validate } from '../../core/middleware/validation.middleware';
import { createTicketSchema, getTicketByIdSchema } from './tickets.validation';
import {
  handleCreateTicket,
  handleGetAllTickets,
  handleGetTicketById,
} from './tickets.controller';

const router = Router();

// Create a new ticket
router.post(
  '/',
  authenticateToken,
  validate(createTicketSchema),
  handleCreateTicket
);

// Get all tickets
router.get('/', handleGetAllTickets);

// Get a single ticket by its ID
router.get(
  '/:ticketId',
  authenticateToken,
  validate(getTicketByIdSchema),
  handleGetTicketById
);

export default router;
