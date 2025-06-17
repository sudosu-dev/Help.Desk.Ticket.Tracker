// backend/src/components/comments/comments.routes.ts

import { Router } from 'express';
import { validate } from '../../core/middleware/validation.middleware';
import { authenticateToken } from '../../core/middleware/auth.middleware';
import {
  handleGetCommentsByTicketId,
  handleCreateComment,
  handleUpdateCommentById,
  handleDeleteCommentById,
  handleMarkCommentAsViewed,
} from './comments.controller';
import {
  getCommentsByTicketIdSchema,
  createCommentSchema,
  updateCommentSchema,
  deleteCommentSchema,
  markCommentViewedSchema,
} from './comments.validation';

const nestedRouter = Router({ mergeParams: true });

// GET /api/v1/tickets/:ticketId/comments
nestedRouter.get(
  '/',
  validate(getCommentsByTicketIdSchema),
  handleGetCommentsByTicketId
);

// POST /api/v1/tickets/:ticketId/comments
nestedRouter.post('/', validate(createCommentSchema), handleCreateComment);

const topLevelRouter = Router();

topLevelRouter.use(authenticateToken);

topLevelRouter.put(
  '/:commentId',
  validate(updateCommentSchema),
  handleUpdateCommentById
);

topLevelRouter.delete(
  '/:commentId',
  validate(deleteCommentSchema),
  handleDeleteCommentById
);

topLevelRouter.post(
  '/:commentId/mark-viewed',
  validate(markCommentViewedSchema),
  handleMarkCommentAsViewed
);

export { topLevelRouter };
export default nestedRouter;
