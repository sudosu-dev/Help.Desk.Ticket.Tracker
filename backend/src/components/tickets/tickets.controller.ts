// backend/src/components/tickets/tickets.controller.ts

import { Request, Response } from 'express';
import * as ticketService from './tickets.service';
import { CreateTicketInput, UpdateTicketInput } from './tickets.validation';
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
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated.' });
      return;
    }

    const tickets = await ticketService.getAllTickets(user);
    res.status(200).json(tickets);
  } catch (error) {
    console.error('[TicketController] Failed to get tickets:', error);
    res.status(500).json({ message: 'Internal Server Error' });
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

/**
 * Handles the request to update a ticket by its ID.
 */
export const handleUpdateTicketById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const ticketId = Number(req.params.ticketId);
    const updateData = req.body;

    const updatedTicket = await ticketService.updateTicketById(
      ticketId,
      updateData
    );

    if (!updatedTicket) {
      res
        .status(404)
        .json({ message: `Ticket with ID ${ticketId} not found.` });
      return;
    }

    res.status(200).json(updatedTicket);
  } catch (error) {
    console.error('[TicketController] Failed to update ticket:', error);
    res.status(500).json({ message: 'Internal service error.' });
  }
};

/**
 * Handles the HTTP request to delete a ticket by its ID.
 */
export const handleDeleteTicketById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const ticketId = Number(req.params.ticketId);

    const deletedRowCount = await ticketService.deleteTicketById(ticketId);

    // If the service returns 0, no rows were deleted, so the ticket was not found.
    if (deletedRowCount === 0) {
      res
        .status(404)
        .json({ message: `Ticket with ID ${ticketId} not found.` });
      return;
    }

    // A 204 No Content response is the standard for a successful DELETE action.
    res.status(204).send();
  } catch (error) {
    console.error(`[TicketController] Failed to delete ticket:`, error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
