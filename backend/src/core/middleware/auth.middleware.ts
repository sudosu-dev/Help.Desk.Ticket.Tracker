// backend/src/core/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        roleId: number;
      };
    }
  }
}

/**
 * Middleware to authenticate users by verifying a JWT from the Authorization header.
 * If the token is valid, it decodes the payload and attaches it to `req.user`.
 * If the token is missing or invalid, it sends a 401 or 403 error response.
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Get authorization header
  const authHeader = req.headers['authorization'];

  // Extract token from the header (format: 'Bearer TOKEN_STRING')
  const token = authHeader && authHeader.split(' ')[1];

  // Check if token exists
  if (!token) {
    res.status(401).json({ message: 'Access denied. No token provided.' });
    return;
  }

  // Verify JWT_SECRET is configured on the server
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error(
      '[AuthMiddleware] Server configuration error: JWT_SECRET is not defined.'
    );
    res
      .status(500)
      .json({ message: 'Authentication configuration error on server.' });
    return;
  }

  // Verify the token
  try {
    const decodedPayload = jwt.verify(token, jwtSecret) as {
      userId: number;
      roleId: number;
      iat: number;
      exp: number;
    };

    // Attach token to request object
    req.user = {
      userId: decodedPayload.userId,
      roleId: decodedPayload.roleId,
    };

    // Pass off to the next middleware route handler
    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Access denied. Token expired.' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({ message: 'Access denied. Invalid token.' });
      return;
    }

    // Handle other errors
    console.error(
      '[AuthMiddleware] Unexpected error during token verification: ',
      error
    );
    res.status(500).json({ message: 'Failed to authenticate token.' });
    return;
  }
};

/**
 * Middleware to authorize users based on their role.
 * @param allowedRoleIds An array of role IDs that are permitted to access the route.
 */
export const authorizeRoles = (allowedRoleIds: number[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user || !user.roleId) {
      res.status(403).json({ message: 'Forbidden: User role not identified.' });
      return;
    }

    // Check if user's role id is included in list of allowed roles
    if (allowedRoleIds.includes(user.roleId)) {
      // User has an allowed role - proceed to next handler
      next();
    } else {
      // User role is not allowed
      res.status(403).json({
        message:
          'Forbidden: You do not have permission to access this resource.',
      });
      return;
    }
  };
};
