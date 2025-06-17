import { Request, Response } from 'express';
import * as commentService from './comments.service';
import { CreateCommentInput, UpdateCommentInput } from './comments.validation';
import { CreateCommentServiceData } from './comments.types';

const ADMIN_ROLE_ID = 1;
const AGENT_ROLE_ID = 3;

/**
 * Handles the request to get all comments for a given ticket.
 */
export const handleGetCommentsByTicketId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const ticketId = Number(req.params.ticketId);
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated.' });
      return;
    }

    const comments = await commentService.getCommentsByTicketId(
      ticketId,
      user.roleId
    );

    res.status(200).json(comments);
  } catch (error) {
    console.error('[CommentController] Failed to get comments:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Handles the request to create a new comment on a ticket.
 */
export const handleCreateComment = async (
  req: Request<{ ticketId: string }, {}, CreateCommentInput>,
  res: Response
): Promise<void> => {
  try {
    const ticketId = Number(req.params.ticketId);
    const user = req.user;
    const { commentText, isInternal, parentCommentId } = req.body;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated.' });
      return;
    }

    const serviceData: CreateCommentServiceData = {
      ticketId,
      userId: user.userId,
      userRoleId: user.roleId,
      commentText,
      isInternal,
      parentCommentId,
    };

    const newComment = await commentService.createComment(serviceData);

    res.status(201).json(newComment);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('Parent comment not found') ||
        error.message.includes('does not belong to the same ticket'))
    ) {
      res.status(400).json({ message: error.message });
      return;
    }
    console.error('[CommentController] Failed to create comment:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
};

/**
 * Handles the request to update an existing comment by its ID.
 */
export const handleUpdateCommentById = async (
  req: Request<{ commentId: string }, {}, UpdateCommentInput>,
  res: Response
): Promise<void> => {
  try {
    const commentId = Number(req.params.commentId);
    const updates = req.body;
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated.' });
      return;
    }

    const updatedComment = await commentService.updateCommentById(
      commentId,
      updates,
      user
    );

    if (!updatedComment) {
      res
        .status(404)
        .json({ message: `Comment with ID ${commentId} not found.` });
      return;
    }

    res.status(200).json(updatedComment);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Forbidden') {
        res.status(403).json({
          message: 'You do not have permission to edit this comment.',
        });
        return;
      }
      if (
        error.message === 'Forbidden: Comment cannot be changed after review.'
      ) {
        res.status(403).json({ message: error.message });
        return;
      }
    }
    console.error('[CommentController] Failed to update comment:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
};

/**
 * Handles the request to delete a comment by its ID.
 */
export const handleDeleteCommentById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const commentId = Number(req.params.commentId);
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated.' });
      return;
    }

    const deletedRowCount = await commentService.deleteCommentById(
      commentId,
      user
    );

    if (deletedRowCount === 0) {
      res
        .status(404)
        .json({ message: `Comment with ID ${commentId} not found.` });
      return;
    }

    res.status(204).send();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Forbidden') {
        res.status(403).json({
          message: 'You do not have permission to delete this comment.',
        });
        return;
      }
      if (
        error.message === 'Forbidden: Comment cannot be changed after review.'
      ) {
        res.status(403).json({ message: error.message });
        return;
      }
    }
    console.error('[CommentController] Failed to delete comment:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Handles the request for an agent/admin to mark a comment as viewed.
 */
export const handleMarkCommentAsViewed = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = req.user;
    const commentId = Number(req.params.commentId);

    if (!user) {
      res.status(401).json({ message: 'User not authenticated.' });
      return;
    }

    const isAgentOrAdmin =
      user.roleId === AGENT_ROLE_ID || user.roleId === ADMIN_ROLE_ID;
    if (!isAgentOrAdmin) {
      res.status(403).json({ message: 'Forbidden.' });
      return;
    }

    await commentService.markCommentAsViewed(commentId);

    res.status(204).send();
  } catch (error) {
    console.error(
      '[CommentController] Failed to mark comment as viewed:',
      error
    );
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
