// backend/src/components/tickets/tickets.validation.ts

import { z } from 'zod';
import { TicketPriority, TicketCategory } from './tickets.types';

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

export const createTicketSchema = z.object({
  body: createTicketBodySchema,
});

export type CreateTicketInput = z.infer<typeof createTicketBodySchema>;
