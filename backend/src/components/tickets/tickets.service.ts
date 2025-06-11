// backend/src/components/tickets/tickets.service.ts

import pool from '../../core/db';
import { toCamelCase } from '../../core/utils/object.utils';
import { CreateTicketServiceData, Ticket } from './tickets.types';

/**
 * Creates a new ticket record in the database.
 *
 * @param {CreateTicketServiceData} ticketData - The data for the new ticket.
 * @returns {Promise<Ticket>} A promise that resolves to the newly created ticket object.
 */
export async function createTicket(
  ticketData: CreateTicketServiceData
): Promise<Ticket> {
  const {
    requesterUserId,
    subject,
    description,
    priority = 'Medium',
    category = 'General IT Support',
  } = ticketData;

  const insertQuery = `
    INSERT INTO tickets (requester_user_id, subject, description, priority, category)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
    `;

  const values = [requesterUserId, subject, description, priority, category];

  try {
    const result = await pool.query(insertQuery, values);
    const newTicket = toCamelCase(result.rows[0]) as Ticket;

    return newTicket;
  } catch (error) {
    console.error('Error creating ticket in database.', error);
    throw new Error('Could not create ticket due to a database error.');
  }
}
