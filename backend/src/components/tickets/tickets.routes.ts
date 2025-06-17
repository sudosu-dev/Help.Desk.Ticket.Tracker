// backend/src/components/tickets/tickets.routes.ts

import { Router } from 'express';
import { authenticateToken } from '../../core/middleware/auth.middleware';
import { validate } from '../../core/middleware/validation.middleware';
import {
  createTicketSchema,
  getTicketByIdSchema,
  updateTicketSchema,
} from './tickets.validation';
import {
  handleCreateTicket,
  handleGetAllTickets,
  handleGetTicketById,
  handleUpdateTicketById,
  handleDeleteTicketById,
} from './tickets.controller';
import commentRoutes from '../comments/comments.routes';

const router = Router();

// Create a new ticket
router.post(
  '/',
  authenticateToken,
  validate(createTicketSchema),
  handleCreateTicket
);

// Get all tickets
router.get('/', authenticateToken, handleGetAllTickets);

// nested comment router - get all comments by ticket ID
router.use('/:ticketId/comments', authenticateToken, commentRoutes);

// Get a single ticket by its ID
router.get(
  '/:ticketId',
  authenticateToken,
  validate(getTicketByIdSchema),
  handleGetTicketById
);

// Update a ticket by its ID
router.put(
  '/:ticketId',
  authenticateToken,
  validate(updateTicketSchema),
  handleUpdateTicketById
);

// Delete a ticet by ID
router.delete(
  '/:ticketId',
  authenticateToken,
  validate(getTicketByIdSchema), // We can re-use this schema
  handleDeleteTicketById
);

export default router;
