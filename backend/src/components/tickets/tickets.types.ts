// backend/src/components/tickets/tickets.types.ts

export type TicketStatus =
  | 'Open'
  | 'In Progress'
  | 'Pending Customer'
  | 'Resolved'
  | 'Closed';

export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type TicketCategory =
  | 'Hardware Issue'
  | 'Software Issue'
  | 'Network Access'
  | 'Account & Access'
  | 'Resource Request'
  | 'Facilities Support'
  | 'HR & Admin Inquiry'
  | 'General IT Support';

export interface Ticket {
  ticketId: number;
  requesterUserId: number;
  assigneeUserId: number | null;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  createdAt: Date;
  updatedAt: Date;
  dueDate: Date | null;
  resolvedAt: Date | null;
  firstResponseDueAt: Date | null;
  resolutionDueAt: Date | null;
  firstRespondedAt: Date | null;
  slaStatus: string | null;
}

/**
 * Defines the data structure required by the service to create a new ticket.
 */
export interface CreateTicketServiceData {
  requesterUserId: number;
  subject: string;
  description: string;
  priority?: TicketPriority;
  category?: TicketCategory;
}

/**
 * Defines the data structure for updating a ticket
 */
export type UpdateTicketServiceData = Partial<{
  assigneeUserId: number | null;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  dueDate: Date | null;
}>;

/**
 * Defines the shape for a ticket as it appears in a list.
 * This is a summary view, containing joined data like names for display.
 */
export interface TicketListView {
  ticketId: number;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  updatedAt: Date;
  requesterName: string;
  assigneeName: string | null;
}
