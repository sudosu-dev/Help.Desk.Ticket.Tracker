import pool from '../../core/db';
import { toCamelCase } from '../../core/utils/object.utils';
import {
  CreateCommentServiceData,
  TicketComment,
  CommentView,
} from './comments.types';
import { UpdateCommentInput } from './comments.validation';

const USER_ROLE_ID = 2;
const ADMIN_ROLE_ID = 1;
const AGENT_ROLE_ID = 3;

export async function getCommentsByTicketId(
  ticketId: number,
  userRoleId: number
): Promise<CommentView[]> {
  const query = `
    SELECT
      c.comment_id,
      c.ticket_id,
      c.comment_text,
      c.is_internal,
      c.parent_comment_id,
      c.created_at,
      c.updated_at,
      u.user_id AS "author.userId",
      CONCAT(u.first_name, ' ', u.last_name) AS "author.fullName",
      r.name AS "author.role"
    FROM
      ticket_comments c
    JOIN
      users u ON c.user_id = u.user_id
    JOIN
      roles r ON u.role_id = r.role_id
    WHERE
      c.ticket_id = $1
      AND ($2 != ${USER_ROLE_ID} OR c.is_internal = FALSE)
    ORDER BY
      c.created_at ASC;
  `;

  try {
    const result = await pool.query(query, [ticketId, userRoleId]);
    return result.rows as CommentView[];
  } catch (error) {
    console.error(`Error fetching comments for ticket ${ticketId}:`, error);
    throw new Error('Could not retrieve comments due to a database error.');
  }
}

/**
 * Creates a comment and updates ticket SLA status within a single transaction.
 */
export async function createComment(
  commentData: CreateCommentServiceData
): Promise<TicketComment> {
  const {
    ticketId,
    userId,
    userRoleId,
    commentText,
    isInternal = false,
    parentCommentId,
  } = commentData;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    if (parentCommentId) {
      const parentCommentResult = await client.query(
        'SELECT ticket_id FROM ticket_comments WHERE comment_id = $1',
        [parentCommentId]
      );
      if (parentCommentResult.rows.length === 0) {
        throw new Error('Parent comment not found.');
      }
      if (parentCommentResult.rows[0].ticket_id !== ticketId) {
        throw new Error('Parent comment does not belong to the same ticket.');
      }
    }

    const createCommentQuery = `
      INSERT INTO ticket_comments (ticket_id, user_id, comment_text, is_internal, parent_comment_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const createCommentResult = await client.query(createCommentQuery, [
      ticketId,
      userId,
      commentText,
      isInternal,
      parentCommentId,
    ]);
    const newComment = toCamelCase(createCommentResult.rows[0]);

    const isAgentOrAdmin =
      userRoleId === AGENT_ROLE_ID || userRoleId === ADMIN_ROLE_ID;

    if (isAgentOrAdmin && !isInternal) {
      const ticketResult = await client.query(
        'SELECT first_responded_at FROM tickets WHERE ticket_id = $1',
        [ticketId]
      );

      if (
        ticketResult.rows.length > 0 &&
        ticketResult.rows[0].first_responded_at === null
      ) {
        await client.query(
          'UPDATE tickets SET first_responded_at = CURRENT_TIMESTAMP WHERE ticket_id = $1',
          [ticketId]
        );
      }
    }

    await client.query('COMMIT');
    return newComment as TicketComment;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in createComment transaction:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(
      'Could not create comment due to a database transaction error.'
    );
  } finally {
    client.release();
  }
}

export async function getCommentById(
  commentId: number
): Promise<TicketComment | null> {
  const query = `SELECT * FROM ticket_comments WHERE comment_id = $1;`;
  try {
    const result = await pool.query(query, [commentId]);
    if (result.rows.length === 0) {
      return null;
    }
    return toCamelCase(result.rows[0]) as TicketComment;
  } catch (error) {
    console.error(`Error fetching comment with ID ${commentId}:`, error);
    throw new Error('Could not retrieve comment due to a database error.');
  }
}

export async function updateCommentById(
  commentId: number,
  updates: UpdateCommentInput,
  user: { userId: number; roleId: number }
): Promise<TicketComment | null> {
  const comment = await getCommentById(commentId);
  if (!comment) {
    return null;
  }

  const isOwner = comment.userId === user.userId;
  const isAdmin = user.roleId === ADMIN_ROLE_ID;

  if (!isOwner && !isAdmin) {
    throw new Error('Forbidden');
  }

  if (!isAdmin && comment.firstViewedByAgentAt) {
    throw new Error('Forbidden: Comment cannot be changed after review.');
  }

  const allowedUpdateFields = ['commentText'];
  const mapToDbColumn = (key: string): string => {
    const mapping: { [key: string]: string } = {
      commentText: 'comment_text',
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

  if (fields.length === 0) {
    return comment;
  }

  values.push(commentId);

  const query = `
    UPDATE ticket_comments
    SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE comment_id = $${queryIndex}
    RETURNING *;
  `;

  try {
    const result = await pool.query(query, values);
    return toCamelCase(result.rows[0]) as TicketComment;
  } catch (error) {
    console.error(`Error updating comment with ID ${commentId}:`, error);
    throw new Error('Could not update comment due to a database error.');
  }
}

export async function deleteCommentById(
  commentId: number,
  user: { userId: number; roleId: number }
): Promise<number> {
  const comment = await getCommentById(commentId);
  if (!comment) {
    return 0;
  }

  const isOwner = comment.userId === user.userId;
  const isAdmin = user.roleId === ADMIN_ROLE_ID;

  if (!isOwner && !isAdmin) {
    throw new Error('Forbidden');
  }

  if (!isAdmin && comment.firstViewedByAgentAt) {
    throw new Error('Forbidden: Comment cannot be changed after review.');
  }

  const query = `DELETE FROM ticket_comments WHERE comment_id = $1;`;

  try {
    const result = await pool.query(query, [commentId]);
    return result.rowCount ?? 0;
  } catch (error) {
    console.error(`Error deleting comment with ID ${commentId}:`, error);
    throw new Error('Could not delete comment due to a database error.');
  }
}

export async function markCommentAsViewed(
  commentId: number
): Promise<TicketComment | null> {
  const query = `
    UPDATE ticket_comments
    SET first_viewed_by_agent_at = CURRENT_TIMESTAMP
    WHERE comment_id = $1 AND first_viewed_by_agent_at IS NULL
    RETURNING *;
  `;
  try {
    const result = await pool.query(query, [commentId]);
    if (result.rowCount === 0) {
      return null;
    }
    return toCamelCase(result.rows[0]) as TicketComment;
  } catch (error) {
    console.error(`Error marking comment ${commentId} as viewed:`, error);
    throw new Error('Could not mark comment as viewed.');
  }
}
