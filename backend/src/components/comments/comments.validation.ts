// backend/src/components/comments/comments.validation.ts

import { z } from 'zod';

/** Validates the request body for creating a new comment. */
const createCommentBodySchema = z.object({
  commentText: z
    .string({ required_error: 'Comment text is required.' })
    .trim()
    .min(1, { message: 'Comment cannot be empty.' })
    .max(5000, { message: 'Comment cannot exceed 5000 characters.' }),
  isInternal: z.boolean().optional().default(false),
  parentCommentId: z.number().int().positive().optional(), // <-- ADD THIS LINE
});

/** Validates the full request context (params and body) for creating a comment. */
export const createCommentSchema = z.object({
  params: z.object({
    ticketId: z.coerce
      .number({ invalid_type_error: 'Ticket ID must be a number.' })
      .int()
      .positive('Ticket ID must be a positive integer.'),
  }),
  body: createCommentBodySchema,
});

/** Validates that a `ticketId` param is a positive integer. */
export const getCommentsByTicketIdSchema = z.object({
  params: z.object({
    ticketId: z.coerce
      .number({ invalid_type_error: 'Ticket ID must be a number.' })
      .int()
      .positive('Ticket ID must be a positive integer.'),
  }),
});

/** Validates the request to update a comment. */
export const updateCommentSchema = z.object({
  params: z.object({
    commentId: z.coerce
      .number({ invalid_type_error: 'Comment ID must be a number.' })
      .int()
      .positive('Comment ID must be a positive integer.'),
  }),
  body: z.object({
    commentText: z
      .string()
      .trim()
      .min(1, { message: 'Comment cannot be empty.' })
      .max(5000, { message: 'Comment cannot exceed 5000 characters.' }),
  }),
});

/** Validates the request to delete a comment. */
export const deleteCommentSchema = z.object({
  params: z.object({
    commentId: z.coerce
      .number({ invalid_type_error: 'Comment ID must be a number.' })
      .int()
      .positive('Comment ID must be a positive integer.'),
  }),
});

/** Validates the request to mark a comment as viewed.*/
export const markCommentViewedSchema = z.object({
  // <-- ADD THIS
  params: deleteCommentSchema.shape.params,
});

/** Inferred type from the Zod schema for a new comment's body. */
export type CreateCommentInput = z.infer<typeof createCommentBodySchema>;

/** Inferred type for updating a comment. */
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>['body'];
