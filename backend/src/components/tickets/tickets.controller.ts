// backend/src/components/tickets/tickets.controller.ts

import { Request, Response } from 'express';
import * as ticketService from './tickets.service';
import { CreateTicketInput } from './tickets.validation';
import { CreateTicketServiceData } from './tickets.types';
import { error } from 'console';

/**
 * Handles the request to create a new ticket.
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

/**
 * Handles the request to get a list of all tickets.
 */
export const handleGetAllTickets = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tickets = await ticketService.getAllTickets();
    res.status(200).json(tickets);
  } catch (error) {
    console.error('[TicketController] Failed to get tickets.');
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Handles the request to get a single ticket by its ID.
 */
export const handleGetTicketById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const ticketId = Number(req.params.ticketId);

    const ticket = await ticketService.getTicketById(ticketId);

    if (!ticket) {
      res
        .status(404)
        .json({ message: `Ticket with ID ${ticketId} not found.` });
      return;
    }

    res.status(200).json(ticket);
  } catch (error) {
    console.error(`[TicketController] Failed to get ticket by ID:`, error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
