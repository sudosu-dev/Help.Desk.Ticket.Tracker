// backend/src/components/tickets/tickets.validation.ts

import { z } from 'zod';
import { TicketPriority, TicketCategory, TicketStatus } from './tickets.types';

const priorityValues: [TicketPriority, ...TicketPriority[]] = [
  'Low',
  'Medium',
  'High',
  'Urgent',
];

const categoryValues: [TicketCategory, ...TicketCategory[]] = [
  'Hardware Issue',
  'Software Issue',
  'Network Access',
  'Account & Access',
  'Resource Request',
  'Facilities Support',
  'HR & Admin Inquiry',
  'General IT Support',
];

const statusValues: [TicketStatus, ...TicketStatus[]] = [
  'Open',
  'In Progress',
  'Pending Customer',
  'Resolved',
  'Closed',
];

const createTicketBodySchema = z.object({
  subject: z
    .string({ required_error: 'Subject is required.' })
    .trim()
    .min(3, { message: 'Subject must be at least 3 characters long.' })
    .max(255, { message: 'Subject cannot exceed 255 characters.' }),
  description: z
    .string({ required_error: 'Description is required.' })
    .trim()
    .min(1, { message: 'Description cannot be empty.' }),
  priority: z.enum(priorityValues).optional(),
  category: z.enum(categoryValues).optional(),
});

const updateTicketBodySchema = z.object({
  subject: z.string().trim().min(3).max(255).optional(),
  description: z.string().trim().min(1).optional(),
  assigneeUserId: z.number().int().positive().nullable().optional(),
  status: z.enum(statusValues).optional(),
  priority: z.enum(priorityValues).optional(),
  category: z.enum(categoryValues).optional(),
  dueDate: z.coerce.date().nullable().optional(),
});

export const createTicketSchema = z.object({
  body: createTicketBodySchema,
});

/**
 * Validates that the ticketId route parameter is a positive integer.
 */
export const getTicketByIdSchema = z.object({
  params: z.object({
    ticketId: z.coerce
      .number({ invalid_type_error: 'Ticket ID must be a number.' })
      .int()
      .positive('Ticket ID must be a positive integer.'),
  }),
});

/**
 * Validates the request for updating a ticket.
 */
export const updateTicketSchema = z.object({
  params: getTicketByIdSchema.shape.params,
  body: updateTicketBodySchema.refine(data => Object.keys(data).length > 0, {
    message: 'Update body cannot be empty.',
  }),
});

export type CreateTicketInput = z.infer<typeof createTicketBodySchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketBodySchema>;
