// backend/src/components/tickets/tickets.service.ts

import pool from '../../core/db';
import { toCamelCase } from '../../core/utils/object.utils';
import {
  CreateTicketServiceData,
  Ticket,
  TicketListView,
} from './tickets.types';

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

/**
 * Retrieves a list of tickets for a summary view.
 */
export async function getAllTickets(): Promise<TicketListView[]> {
  // This query joins with the user table twice to get full names.
  const query = `
    SELECT
        t.ticket_id,
        t.subject,
        t.status,
        t.priority,
        t.updated_at,
        CONCAT(r.first_name, ' ', r.last_name) AS requester_name,
        CONCAT(a.first_name, ' ', a.last_name) AS assignee_name
    FROM 
        tickets t
    JOIN
        users r ON t.requester_user_id = r.user_id
    LEFT JOIN
        users a ON assignee_user_id = a.user_id
    ORDER BY
        t.updated_at DESC;
    `;

  try {
    const result = await pool.query(query);
    return toCamelCase(result.rows) as TicketListView[];
  } catch (error) {
    console.error('Error fetching tickets:', error);
    throw new Error('Could not retrieve tickets.');
  }
}

/**
 * Retrieves a single ticket by its ID.
 * @param ticketId The ID of the ticket to retrieve.
 * @returns A ticket object if found, otherwise null.
 */
export async function getTicketById(ticketId: number): Promise<Ticket | null> {
  const query = `
    SELECT * FROM tickets WHERE ticket_id = $1;
  `;

  try {
    const result = await pool.query(query, [ticketId]);

    // If no rows are returned, the ticket does not exist.
    if (result.rows.length === 0) {
      return null;
    }

    return toCamelCase(result.rows[0]) as Ticket;
  } catch (error) {
    console.error(`Error fetching ticket with ID ${ticketId}:`, error);
    throw new Error('Could not retrieve ticket.');
  }
}
