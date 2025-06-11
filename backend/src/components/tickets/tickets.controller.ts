// backend/src/components/tickets/tickets.controller.ts

import { Request, Response } from 'express';
import * as ticketService from './tickets.service';
import { CreateTicketInput } from './tickets.validation';
import { CreateTicketServiceData } from './tickets.types';

/**
 * Handles the HTTP request to create a new ticket.
 *
 */
export const handleCreateTicket = async (
  req: Request<{}, {}, CreateTicketInput>,
  res: Response
): Promise<void> => {
  try {
    const requesterUserId = req.user?.userId;

    if (!requesterUserId) {
      res.status(401).json({ message: 'User not authenticated.' });
      return;
    }

    const serviceData: CreateTicketServiceData = {
      requesterUserId: requesterUserId,
      subject: req.body.subject,
      description: req.body.description,
      priority: req.body.priority,
      category: req.body.category,
    };

    const newTicket = await ticketService.createTicket(serviceData);

    res.status(201).json(newTicket);
  } catch (error) {
    console.error('[TicketController] Failed to create ticket:', error);
    res.status(500).json({ message: 'Internal service error.' });
  }
};
