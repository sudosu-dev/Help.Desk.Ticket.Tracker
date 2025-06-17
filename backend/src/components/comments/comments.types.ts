// backend/src/components/comments/comments.types.ts

/** Defines the shape of a ticket comment record from the database. */
export interface TicketComment {
  commentId: number;
  ticketId: number;
  userId: number;
  commentText: string;
  isInternal: boolean;
  parentCommentId: number | null;
  createdAt: Date;
  updatedAt: Date | null;
  firstViewedByAgentAt: Date | null;
}

/** The data required by the service layer to create a new comment. */
export interface CreateCommentServiceData {
  ticketId: number;
  userId: number;
  userRoleId: number; // <-- ADD THIS LINE
  commentText: string;
  isInternal?: boolean;
  parentCommentId?: number | null;
}

/** A detailed comment view for the client, including author info. */
export interface CommentView {
  commentId: number;
  ticketId: number;
  author: {
    userId: number;
    fullName: string;
    role: string;
  };
  commentText: string;
  isInternal: boolean;
  parentCommentId: number | null;
  createdAt: Date;
  updatedAt: Date | null;
}
