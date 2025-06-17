// backend/src/components/tickets/tickets.service.ts

import pool from '../../core/db';
import { toCamelCase } from '../../core/utils/object.utils';
import {
  CreateTicketServiceData,
  Ticket,
  TicketListView,
} from './tickets.types';
import { UpdateTicketInput } from './tickets.validation';

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
 * Retrieves a list of tickets based on the users role.
 * @param user The authenticated user object, containing userId and roleId.
 */
export async function getAllTickets(user: {
  userId: number;
  roleId: number;
}): Promise<TicketListView[]> {
  const baseQuery = `
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
      users a ON t.assignee_user_id = a.user_id
  `;

  const values: any[] = [];
  let finalQuery = baseQuery;

  // Check if it's a user making the request (role 2 is user)
  if (user.roleId === 2) {
    finalQuery += ` WHERE t.requester_user_id = $1`;
    values.push(user.userId);
  }

  finalQuery += ` ORDER BY t.updated_at DESC;`;

  try {
    const result = await pool.query(finalQuery, values);
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

/**
 * Updates a ticket using a dynamic query based on the provided fields.
 * @param ticketId The ID of the ticket to update.
 * @param updates An object containing the fields to update.
 * @returns The updated ticket object, or null if not found.
 */
export async function updateTicketById(
  ticketId: number,
  updates: UpdateTicketInput
): Promise<Ticket | null> {
  // Whitelist
  const allowedUpdateFields = [
    'subject',
    'description',
    'assigneeUserId',
    'status',
    'priority',
    'category',
    'dueDate',
  ];

  const mapToDbColumn = (key: string): string => {
    const mapping: { [key: string]: string } = {
      assigneeUserId: 'assignee_user_id',
      dueDate: 'due_date',
    };
    return mapping[key] || key;
  };

  const fields: string[] = [];
  const values: any[] = [];
  let queryIndex = 1;

  for (const key in updates) {
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      if (allowedUpdateFields.includes(key)) {
        const value = (updates as any)[key];
        const dbColumn = mapToDbColumn(key);
        fields.push(`${dbColumn} = $${queryIndex++}`);
        values.push(value);
      }
    }
  }

  values.push(ticketId);

  const query = `
    UPDATE tickets
    SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE ticket_id = $${queryIndex}
    RETURNING *;
  `;

  try {
    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
      return null;
    }
    return toCamelCase(result.rows[0]) as Ticket;
  } catch (error) {
    console.error(`Error updating ticket with ID ${ticketId}:`, error);
    throw new Error('Could not update ticket.');
  }
}

/**
 * Deletes a ticket by its ID.
 * @param ticketId The ID of the ticket to delete.
 * @returns The number of rows affected (0 if not found, 1 if deleted).
 */
export async function deleteTicketById(ticketId: number): Promise<number> {
  const query = `
    DELETE FROM tickets WHERE ticket_id = $1
  `;

  try {
    const result = await pool.query(query, [ticketId]);
    return result.rowCount ?? 0;
  } catch (error) {
    console.error(`Error deleting ticket with ID ${ticketId}:`, error);
    throw new Error('Could not delete ticket.');
  }
}
