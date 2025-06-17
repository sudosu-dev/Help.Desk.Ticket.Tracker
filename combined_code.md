

## backend\.eslintrc.js

```js
// backend/.eslintrc.js
module.exports = {
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser for TypeScript
  extends: [
    'eslint:recommended', // Uses the recommended rules from ESLint
    'plugin:@typescript-eslint/recommended', // Uses the recommended rules from @typescript-eslint/eslint-plugin
    'prettier', // Uses eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with Prettier
    'plugin:prettier/recommended', // Enables eslint-plugin-prettier and displays Prettier errors as ESLint errors. **Make sure this is always the last configuration in the extends array.**
  ],
  parserOptions: {
    ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
    sourceType: 'module', // Allows for the use of imports
  },
  env: {
    node: true, // Enable Node.js global variables and Node.js scoping.
    es2021: true, // Add global variables for ES2021 (you can adjust the year as needed).
  },
  rules: {
    // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs.
    // Examples:
    // "@typescript-eslint/explicit-function-return-type": "warn",
    // "@typescript-eslint/no-explicit-any": "warn",
    // "no-console": "warn", // Example: warn about console.log statements
  },
};

```


## backend\.prettierrc.js

```js
// backend/.prettierrc.js
module.exports = {
  semi: true, // Add a semicolon at the end of statements.
  trailingComma: "es5", // Add trailing commas where valid in ES5 (objects, arrays, etc.)
  singleQuote: true, // Use single quotes instead of double quotes.
  printWidth: 80, // Specify the line length that the printer will wrap on.
  tabWidth: 2, // Specify the number of spaces per indentation-level.
  arrowParens: "avoid", // Omit parens when possible for arrow functions (e.g. x => x)
};

```


## backend\src\api\admin.routes.ts

```ts
// backend/src/api/admin.routes.ts

import { Router, Request, Response } from 'express';
import {
  authenticateToken,
  authorizeRoles,
} from '../core/middleware/auth.middleware';
import userRoutes from '../components/user/user.routes';

const router = Router();
const ADMIN_ROLE_ID = 1;

router.use(authenticateToken, authorizeRoles([ADMIN_ROLE_ID]));

// --- Mount resource-specific admin routes ---

router.use('/users', userRoutes);

// --- Standalone Admin Routes ---

router.get('/dashboard', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to the Admin Dashboard!',
    user: req.user,
  });
});

export default router;

```


## backend\src\api\auth.routes.ts

```ts
import { Router, Request, Response } from 'express';
import {
  handleUserRegistration,
  handleUserLogin,
  handleUserLogout,
  handleRequestPasswordReset,
  handleResetPassword,
} from '../components/auth/auth.controller';
import { validate } from '../core/middleware/validation.middleware';
import {
  registerSchema,
  loginSchema,
} from '../components/auth/auth.validation';
import { authenticateToken } from '../core/middleware/auth.middleware';

// import * as AuthController from '../components/auth/auth.controller';

const router = Router();

// --- Public Routes ---
router.post('/register', validate(registerSchema), handleUserRegistration);
router.post('/login', validate(loginSchema), handleUserLogin);
router.post('/forgot-password', handleRequestPasswordReset);
router.post('/reset-password', handleResetPassword);

// --- Protected Routes ---
router.post('/logout', authenticateToken, handleUserLogout); // << USE authenticateToken here

export default router;

```


## backend\src\api\index.ts

```ts
import { Router } from 'express';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import ticketRoutes from '../components/tickets/tickets.routes';

const router = Router();

// API V1 root route
router.get('/', (req, res) => {
  res
    .status(200)
    .json({ message: 'API V1 is alive and main router is working!' });
});

// Resource specific routes
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/tickets', ticketRoutes);
// TODO: Import and use other resource-specific routes here

export default router;

```


## backend\src\app.ts

```ts
import express, {
  Application,
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from 'express';
import cors from 'cors';
import apiRouterV1 from './api';

const app: Application = express();

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// Simple Root Route for testing
// app.get('/', (req: Request, res: Response) => {
//   res.status(200).json({
//     message: 'Welcome to the Help Desk API!',
//     timeStamp: new Date().toISOString(),
//   });
// });

// Mount API routes
app.use('/api/v1', apiRouterV1);

// TODO: Add Global Error Handling Middleware
// app.use((err: Error, req: Request, res: Response, next: NextFunction) => {});

// --- Global Error-Handling Middleware ---

const globalErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
  console.error('[GlobalErrorHandler]:', error);

  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({
      error: 'Invalid Request Body',
      message: 'Malformed JSON in request body.',
    });
    return;
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred.',
  });
};

app.use(globalErrorHandler);

export default app;

```


## backend\src\components\auth\auth.controller.ts

```ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import * as authService from './auth.service';
import {
  UserRegistrationData,
  UserLoginData,
  LoginSuccessResponse,
  // RegisteredUser,
  ResetPasswordData,
} from './auth.types';
import { RegisterUserInput, LoginUserInput } from './auth.validation';

import { nextTick } from 'process';

// --- USER REGISTRATION ----

export const handleUserRegistration: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
    }: RegisterUserInput = req.body;

    const registrationData: UserRegistrationData = {
      username,
      email,
      password_plaintext: password,
      firstName,
      lastName,
      phoneNumber,
    };

    const registeredUser = await authService.registerNewUser(registrationData);

    res.status(201).json({
      message: 'User registered successfully!',
      user: {
        userId: registeredUser.userId,
        username: registeredUser.username,
        email: registeredUser.email,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('[AuthController - Register] Error:', error.message);
      if (error.message === 'Username or email already exists.') {
        res.status(409).json({ message: error.message });
      } else {
        res.status(500).json({
          message: 'User registration failed due to an internal error.',
        });
      }
    } else {
      res.status(500).json({ message: 'An unexpected error occurred.' });
    }
  }
};

// ---- LOGIN ----

export const handleUserLogin: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { emailOrUsername, password }: LoginUserInput = req.body;

    const loginData: UserLoginData = {
      emailOrUsername,
      password_plaintext: password,
    };

    const loginResult: LoginSuccessResponse =
      await authService.loginUser(loginData);

    res.status(200).json({
      message: 'Login successful!',
      token: loginResult.token,
      user: loginResult.user,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('[AuthController - Login] Error:', error.message);
      if (
        error.message === 'Invalid email/username or password.' ||
        error.message === 'Account is inactive. Please contact support.'
      ) {
        res
          .status(401)
          .json({ message: 'Invalid credentials or login issue.' });
      } else {
        res
          .status(500)
          .json({ message: 'Login failed due to an internal server error.' });
      }
    } else {
      res
        .status(500)
        .json({ message: 'An unexpected error occurred during login.' });
    }
  }
};

// --- REQUEST PASSWORD RESET ----

export const handleRequestPasswordReset: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: 'Email is required.' });
      return;
    }

    const plaintextToken = await authService.requestPasswordReset(email);

    if (plaintextToken) {
      console.log(
        `[AuthController - RequestReset] Password reset token generated for ${email}: ${plaintextToken}`
      );
    } else {
      console.log(
        `[AuthController - RequestReset] Password reset requested for non-existent or inactive email: ${email}`
      );
    }

    res.status(200).json({
      message:
        'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('[AuthController - RequestReset] Error:', error);
    res.status(500).json({
      message:
        'Failed to process password reset request due to an internal server error.',
    });
  }
};

// ---- PASSWORD RESET ----

export const handleResetPassword: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ message: 'Token and new password are required.' });
      return;
    }

    const resetData: ResetPasswordData = {
      token,
      newPassword_plaintext: newPassword,
    };

    await authService.resetPassword(resetData);

    res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    if (error instanceof Error) {
      console.error('[AuthController-ResetPassword] Error:', error.message);
      if (error.message === 'Invalid or expired password reset token.') {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({
          message: 'Password reset failed due to an internal server error.',
        });
      }
    } else {
      res.status(500).json({
        message: 'An unexpected error occurred during password reset.',
      });
    }
  }
};

// ---- LOGOUT ----

export const handleUserLogout: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await authService.logoutUser();
    res.status(200).json({ message: result.message || 'Logout successful.' });
  } catch (error) {
    console.error('[AuthController - Logout] Error:', error);
    res.status(500).json({
      message: 'Logout failed due to an internal server error.',
    });
  }
};

```


## backend\src\components\auth\auth.service.ts

```ts
// In: backend/src/components/auth/auth.service.ts

import pool from '../../core/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { RegisteredUser } from '../../core/types/types';
import { toCamelCase } from '../../core/utils/object.utils';
import {
  UserRegistrationData,
  UserLoginData,
  LoginSuccessResponse,
  ResetPasswordData,
} from './auth.types';
import { getJwtExpiresInSeconds } from '../../core/utils/jwt.utils';

// ---- LOGIN ----

export const loginUser = async (
  loginData: UserLoginData
): Promise<LoginSuccessResponse> => {
  const { emailOrUsername, password_plaintext } = loginData;

  // Normalize emailOrUsername
  const normalizedEmailOrUsername = emailOrUsername.trim().toLowerCase();

  // Find the user by email or username
  const userQueryResult = await pool.query(
    'SELECT user_id, username, email, role_id, password_hash, is_active FROM users WHERE email = $1 OR username = $1',
    [normalizedEmailOrUsername]
  );

  if (userQueryResult.rows.length === 0) {
    throw new Error('Invalid email/username or password.');
  }

  // Convert the snake_case result from the DB to a camelCase object
  const user = toCamelCase(userQueryResult.rows[0]);

  // Check if user is active
  if (!user.isActive) {
    throw new Error('Account is inactive. Please contact support.');
  }

  // Compare the provided password with the stored hash
  const passwordMatches = await bcrypt.compare(
    password_plaintext,
    user.passwordHash
  );

  if (!passwordMatches) {
    throw new Error('Invalid email/username or password.');
  }

  // Generate JWT
  const jwtSecret: string = process.env.JWT_SECRET!;

  if (!jwtSecret) {
    console.error('JWT_SECRET is not defined in environment variables.');
    throw new Error('Authentication configuration error.');
  }

  const payload = {
    userId: user.userId,
    roleId: user.roleId,
  };

  // Using your robust utility function to fix the TypeScript error
  const expiresInSeconds = getJwtExpiresInSeconds();

  const token = jwt.sign(payload, jwtSecret, {
    expiresIn: expiresInSeconds,
  });

  return {
    token,
    user: {
      userId: user.userId,
      username: user.username,
      email: user.email,
      roleId: user.roleId,
    },
  };
};

// ---- USER REGISTRATION ----

export const registerNewUser = async (
  userData: UserRegistrationData
): Promise<RegisteredUser> => {
  const {
    username,
    email,
    password_plaintext,
    firstName,
    lastName,
    phoneNumber,
  } = userData;

  // Normalize username and email
  const normalizedUsername = username.trim().toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();

  // Check if user already exists
  const existingUserResult = await pool.query(
    'SELECT user_id FROM users WHERE username = $1 OR email = $2',
    [normalizedUsername, normalizedEmail]
  );

  if (existingUserResult.rows.length > 0) {
    throw new Error('Username or email already exists.');
  }

  // Hash the password
  const saltRounds = 10; // Or from environment variable...
  const password_hash = await bcrypt.hash(password_plaintext, saltRounds);

  // Insert the new user
  // role_id defaults to 2 (user) and is_active defaults to TRUE in the DB schema
  const insertQuery = `
        INSERT INTO users (username, email, password_hash, first_name, last_name, phone_number)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
    `;
  const values = [
    normalizedUsername,
    normalizedEmail,
    password_hash,
    firstName,
    lastName,
    phoneNumber,
  ];

  try {
    const newUserResult = await pool.query(insertQuery, values);
    if (newUserResult.rows.length === 0) {
      // This should not happen if the insert was successful and returning was used
      throw new Error('User registration failed, user not created.');
    }
    // Convert the returned DB object to camelCase to match the RegisteredUser interface
    return toCamelCase(newUserResult.rows[0]) as RegisteredUser;
  } catch (error) {
    console.error('Error during registration:', error);
    throw new Error('Could not register user due to a database error.');
  }
};

// ---- LOGOUT ----

/**
 * Handles backend logic for user logout.
 * For stateless JWTs where logout is primarily client-side (token deletion),
 * this function might be minimal or used for logging logout activity in the future.
 * For V1, it simply acknowledges the request.
 * @returns Promise<void>
 */
export const logoutUser = async (): Promise<{ message: string }> => {
  return { message: 'Logout process initiated on server.' };
};

// ---- REQUEST PASSWORD ----

/**
 * Handles a request to reset a user's password.
 * Generates a reset token, stores its hash, and returns the plaintext token.
 * In a full implementation, this plaintext token would be used to send a reset email.
 * @param email The email address of the user requesting the password reset.
 * @returns Promise<string | null> The plaintext reset token if a user was found, otherwise null.
 */
export const requestPasswordReset = async (
  email: string
): Promise<string | null> => {
  // Find the user by email
  const userQueryResult = await pool.query(
    'SELECT user_id FROM users WHERE email = $1 AND is_active = TRUE',
    [email.trim().toLowerCase()]
  );

  if (userQueryResult.rows.length === 0) {
    console.log(
      `[AuthService-RequestReset] No active user found for email: ${email}`
    );
    return null;
  }

  const userId = userQueryResult.rows[0].user_id;

  // Generate a secure plaintext token
  const plaintextToken = crypto.randomBytes(32).toString('hex');

  // Hash the token before storing in database
  const tokenHash = crypto
    .createHash('sha256')
    .update(plaintextToken)
    .digest('hex');

  // Set token expiration
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  // Delete any previous, unexpired reset tokens for this user
  try {
    await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [
      userId,
    ]);

    // Store the hashed token, user_id, and expiration date
    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [userId, tokenHash, expiresAt]
    );

    console.log(
      `[AuthService-RequestReset] Password reset token generated and stored for user: ${userId}`
    );

    // Return the plaintext token to be used in the reset email
    return plaintextToken;
  } catch (error) {
    console.error(
      '[AuthService-RequestReset] Error during token operation:',
      error
    );
    throw new Error('Could not process password reset due to a server error.');
  }
};

/**
 * Resets a user's password using a valid reset token.
 * @param resetData Contains the plaintext token and the new password.
 * @returns Promise<void> Resolves if password reset is successful.
 * @throws Error if token is invalid, expired, or if the password update fails.
 */
export const resetPassword = async (
  resetData: ResetPasswordData
): Promise<void> => {
  const { token, newPassword_plaintext } = resetData;

  // Hash the incoming plaintext token to compare with the database
  const incomingTokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find the token in the database and verify it's not expired
  const tokenQueryResult = await pool.query(
    'SELECT user_id, expires_at FROM password_reset_tokens WHERE token_hash = $1',
    [incomingTokenHash]
  );

  if (tokenQueryResult.rows.length === 0) {
    console.log(
      `[AuthService - ResetPassword] Invalid or non-existent token hash provided.`
    );
    throw new Error('Invalid or expired password reset token.');
  }

  const tokenData = tokenQueryResult.rows[0];
  const userId = tokenData.user_id;
  const expiresAt = new Date(tokenData.expires_at);

  if (expiresAt < new Date()) {
    console.log(
      `[AuthService - ResetPassword] Expired token provided for user_id: ${userId}.`
    );
    // delete the expired token
    await pool.query(
      'DELETE FROM password_reset_tokens WHERE token_hash = $1',
      [incomingTokenHash]
    );
    throw new Error('Invalid or expired password reset token.');
  }

  // Hash the new password
  const saltRounds = 10;
  const newPasswordHash = await bcrypt.hash(newPassword_plaintext, saltRounds);

  // Update the user's password in the users table
  const updateUserPasswordResult = await pool.query(
    'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
    [newPasswordHash, userId]
  );

  if (updateUserPasswordResult.rowCount === 0) {
    console.error(
      `[AuthService - ResetPassword] Failed to update the password for user ${userId}. User might not exist or DB issue.`
    );
    throw new Error('Failed to update password.');
  }

  // Delete the used password reset token from the database
  await pool.query('DELETE FROM password_reset_tokens WHERE token_hash = $1', [
    incomingTokenHash,
  ]);

  console.log(
    `[AuthService - ResetPassword] Password successfully reset for user ${userId}.`
  );
};

```


## backend\src\components\auth\auth.types.ts

```ts
// backend/src/components/auth/auth.types.ts

// Interface for the data expected for user registration
export interface UserRegistrationData {
  username: string;
  email: string;
  password_plaintext: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

// Interface for the data expected for user login
export interface UserLoginData {
  emailOrUsername: string;
  password_plaintext: string;
}

// Interface for the login response
export interface LoginSuccessResponse {
  token: string;
  user: {
    userId: number;
    username: string;
    email: string;
    roleId: number;
  };
}

// Interface for the data expected for password reset
export interface ResetPasswordData {
  token: string;
  newPassword_plaintext: string;
}

```


## backend\src\components\auth\auth.validation.ts

```ts
// backend/src/components/auth/auth.validation.ts

import { z } from 'zod';

// Schema for user registration
export const userRegistrationBodySchema = z.object({
  username: z
    .string({ required_error: 'Username is required.' })
    .trim()
    .min(3, { message: 'Username must be at least 3 characters long.' })
    .max(50, { message: 'Username cannot exceed 50 characters.' })
    .toLowerCase(),
  email: z
    .string({ required_error: 'Email is required.' })
    .trim()
    .email({ message: 'Invalid email address format.' })
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required.' })
    .min(8, { message: 'Password must be at least 8 characters long.' })
    .max(100, { message: 'Password cannot exceed 100 characters.' })
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
    ),
  firstName: z
    .string({ required_error: 'First name is required.' })
    .trim()
    .min(1, { message: 'First name cannot be empty.' })
    .max(100, { message: 'First name cannot exceed 100 characters.' }),
  lastName: z
    .string({ required_error: 'Last name is required.' })
    .trim()
    .min(1, { message: 'Last name cannot be empty' })
    .max(100, { message: 'Last name cannot exceed 100 characters' }),
  phoneNumber: z
    .string({ required_error: 'Phone number is required.' })
    .trim()
    .min(7, { message: 'Phone number seems too short.' })
    .max(30, { message: 'Phone number seems too long.' })
    .regex(
      /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
      'Invalid phone number format'
    ),
});

export const registerSchema = z.object({
  body: userRegistrationBodySchema,
});

//  Schema for user login
export const loginSchema = z.object({
  body: z.object({
    emailOrUsername: z
      .string({ required_error: 'Email or username is required.' })
      .trim()
      .min(1, { message: 'Email or username cannot be empty.' })
      .toLowerCase(),
    password: z
      .string({ required_error: 'Password is required.' })
      .min(1, { message: 'Password cannot be empty.' }),
  }),
});

// Type alias for inferring the registration data type from the Zod schema
export type RegisterUserInput = z.infer<typeof registerSchema>['body'];

// Type alias for inferring the login data type from the Zod schema
export type LoginUserInput = z.infer<typeof loginSchema>['body'];

```


## backend\src\components\tickets\tickets.controller.ts

```ts
// backend/src/components/tickets/tickets.controller.ts

import { Request, Response } from 'express';
import * as ticketService from './tickets.service';
import { CreateTicketInput, UpdateTicketInput } from './tickets.validation';
import { CreateTicketServiceData } from './tickets.types';
import { error } from 'console';

/**
 * Handles the request to create a new ticket.
 *
 */
export const handleCreateTicket = async (
  req: Request<{}, {}, CreateTicketInput>,
  res: Response
): Promise<void> => {
  try {
    const requesterUserId = req.user?.userId;

    if (!requesterUserId) {
      res.status(401).json({ message: 'User not authenticated.' });
      return;
    }

    const serviceData: CreateTicketServiceData = {
      requesterUserId: requesterUserId,
      subject: req.body.subject,
      description: req.body.description,
      priority: req.body.priority,
      category: req.body.category,
    };

    const newTicket = await ticketService.createTicket(serviceData);

    res.status(201).json(newTicket);
  } catch (error) {
    console.error('[TicketController] Failed to create ticket:', error);
    res.status(500).json({ message: 'Internal service error.' });
  }
};

/**
 * Handles the request to get a list of all tickets.
 */
export const handleGetAllTickets = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated.' });
      return;
    }

    const tickets = await ticketService.getAllTickets(user);
    res.status(200).json(tickets);
  } catch (error) {
    console.error('[TicketController] Failed to get tickets:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Handles the request to get a single ticket by its ID.
 */
export const handleGetTicketById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const ticketId = Number(req.params.ticketId);

    const ticket = await ticketService.getTicketById(ticketId);

    if (!ticket) {
      res
        .status(404)
        .json({ message: `Ticket with ID ${ticketId} not found.` });
      return;
    }

    res.status(200).json(ticket);
  } catch (error) {
    console.error(`[TicketController] Failed to get ticket by ID:`, error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Handles the request to update a ticket by its ID.
 */
export const handleUpdateTicketById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const ticketId = Number(req.params.ticketId);
    const updateData = req.body;

    const updatedTicket = await ticketService.updateTicketById(
      ticketId,
      updateData
    );

    if (!updatedTicket) {
      res
        .status(404)
        .json({ message: `Ticket with ID ${ticketId} not found.` });
      return;
    }

    res.status(200).json(updatedTicket);
  } catch (error) {
    console.error('[TicketController] Failed to update ticket:', error);
    res.status(500).json({ message: 'Internal service error.' });
  }
};

/**
 * Handles the HTTP request to delete a ticket by its ID.
 */
export const handleDeleteTicketById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const ticketId = Number(req.params.ticketId);

    const deletedRowCount = await ticketService.deleteTicketById(ticketId);

    // If the service returns 0, no rows were deleted, so the ticket was not found.
    if (deletedRowCount === 0) {
      res
        .status(404)
        .json({ message: `Ticket with ID ${ticketId} not found.` });
      return;
    }

    // A 204 No Content response is the standard for a successful DELETE action.
    res.status(204).send();
  } catch (error) {
    console.error(`[TicketController] Failed to delete ticket:`, error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

```


## backend\src\components\tickets\tickets.routes.ts

```ts
// backend/src/components/tickets/tickets.routes.ts

import { Router } from 'express';
import { authenticateToken } from '../../core/middleware/auth.middleware';
import { validate } from '../../core/middleware/validation.middleware';
import {
  createTicketSchema,
  getTicketByIdSchema,
  updateTicketSchema,
} from './tickets.validation';
import {
  handleCreateTicket,
  handleGetAllTickets,
  handleGetTicketById,
  handleUpdateTicketById,
  handleDeleteTicketById,
} from './tickets.controller';

const router = Router();

// Create a new ticket
router.post(
  '/',
  authenticateToken,
  validate(createTicketSchema),
  handleCreateTicket
);

// Get all tickets
router.get('/', authenticateToken, handleGetAllTickets);

// Get a single ticket by its ID
router.get(
  '/:ticketId',
  authenticateToken,
  validate(getTicketByIdSchema),
  handleGetTicketById
);

// Update a ticket by its ID
router.put(
  '/:ticketId',
  authenticateToken,
  validate(updateTicketSchema),
  handleUpdateTicketById
);

// Delete a ticet by ID
router.delete(
  '/:ticketId',
  authenticateToken,
  validate(getTicketByIdSchema), // We can re-use this schema
  handleDeleteTicketById
);

export default router;

```


## backend\src\components\tickets\tickets.service.ts

```ts
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

```


## backend\src\components\tickets\tickets.types.ts

```ts
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

```


## backend\src\components\tickets\tickets.validation.ts

```ts
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

```


## backend\src\components\user\user.controller.ts

```ts
// backend/src/components/user/user.controller.ts

import { Request, Response } from 'express';
import {
  createUserByAdmin,
  getAllUsers,
  getUserById,
  updateUserById,
} from './user.service';
import { CreateUserByAdminInput, UpdateUserInput } from './user.validation';
import { AdminCreateUserData } from './user.types';

/**
 * Handles the HTTP request to create a new user by an administrator.
 */
export const handleCreateUserByAdmin = async (
  req: Request<{}, {}, CreateUserByAdminInput>,
  res: Response
): Promise<void> => {
  try {
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      roleId,
      isActive,
    } = req.body;

    const serviceData: AdminCreateUserData = {
      username,
      email,
      password_plaintext: password,
      firstName,
      lastName,
      phoneNumber,
      roleId,
      isActive,
    };

    const newUser = await createUserByAdmin(serviceData);

    res.status(201).json(newUser);
  } catch (error) {
    console.error('[UserController] Failed to create user:', error);

    if (error instanceof Error) {
      if (error.message === 'Username or email is already in use.') {
        res.status(409).json({ message: error.message });
        return;
      }
    }

    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Handles the HTTP request to retrieve a list of all users.
 */
export const handleGetAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const users = await getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    console.error('[UserController] Failed to get all users:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Handles the HTTP request to retrieve a single user by their ID.
 */
export const handleGetUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const user = await getUserById(userId);

    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(`[UserController] Failed to get user by ID:`, error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Handles the HTTP request to partially update a user by their ID.
 */
export const handleUpdateUserById = async (
  req: Request<{ userId: string }, {}, UpdateUserInput>,
  res: Response
): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const updateData = req.body;

    const updatedUser = await updateUserById(userId, updateData);

    // Check if the user was found.
    if (!updatedUser) {
      res.status(404).json({ message: `User with ID ${userId} not found.` });
      return;
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error(
      `[UserController] Failed to update user with ID ${req.params.userId}:`,
      error
    );

    if (error instanceof Error) {
      if (error.message.includes('already in use')) {
        res.status(409).json({ message: error.message });
        return;
      }
    }

    res.status(500).json({ message: 'Internal Server Error' });
  }
};

```


## backend\src\components\user\user.routes.ts

```ts
// backend/src/components/user/user.routes.ts

import { Router } from 'express';
import { validate } from '../../core/middleware/validation.middleware';
import {
  handleCreateUserByAdmin,
  handleGetAllUsers,
  handleGetUserById,
  handleUpdateUserById,
} from './user.controller';
import {
  createUserByAdminSchema,
  getUserByIdSchema,
  updateUserSchema,
} from './user.validation';

const router = Router();

// Routes for user management by admin

// Create a user
router.post('/', validate(createUserByAdminSchema), handleCreateUserByAdmin);

// Get all users
router.get('/', handleGetAllUsers);

// Get user by ID
router.get('/:userId', validate(getUserByIdSchema), handleGetUserById);

// Update user by ID
router.put('/:userId', validate(updateUserSchema), handleUpdateUserById);

// We will add GET, PUT, and DELETE routes for users here later.

export default router;

```


## backend\src\components\user\user.service.ts

```ts
// In: backend/src/components/user/user.service.ts

import bcrypt from 'bcrypt';
import pool from '../../core/db';
import { RegisteredUser } from '../../core/types/types';
import {
  AdminCreateUserData,
  UserListView,
  UserUpdateData,
} from './user.types';
import { toCamelCase } from '../../core/utils/object.utils';

const SALT_ROUNDS = 10;

/**
 * Creates a new user record in the database, intended for use by an administrator.
 * @param {AdminCreateUserData} userData - The data for the new user.
 * @returns {Promise<RegisteredUser>} A promise that resolves to the newly created user object.
 * @throws Will throw an Error if the username or email is already in use.
 */
export async function createUserByAdmin(
  userData: AdminCreateUserData
): Promise<RegisteredUser> {
  // Destructure the camelCase properties from the input
  const {
    username,
    email,
    password_plaintext,
    firstName,
    lastName,
    phoneNumber,
    roleId,
    isActive,
  } = userData;

  const normalizedUsername = username.trim().toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();

  const existingUserResult = await pool.query(
    'SELECT user_id FROM users WHERE username = $1 OR email = $2',
    [normalizedUsername, normalizedEmail]
  );

  if (existingUserResult.rows.length > 0) {
    throw new Error('Username or email is already in use.');
  }

  const password_hash = await bcrypt.hash(password_plaintext, SALT_ROUNDS);

  // The INSERT query uses snake_case column names
  const insertQuery = `
    INSERT INTO users (username, email, password_hash, first_name, last_name, phone_number, role_id, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;
  // The values array now uses the camelCased variables
  const values = [
    normalizedUsername,
    normalizedEmail,
    password_hash,
    firstName,
    lastName,
    phoneNumber,
    roleId,
    isActive,
  ];

  try {
    const newUserResult = await pool.query(insertQuery, values);
    // Convert the snake_case result from the DB to a camelCase object before returning
    return toCamelCase(newUserResult.rows[0]) as RegisteredUser;
  } catch (error) {
    console.error('Error creating user in database:', error);
    throw new Error('Could not create user due to a database error.');
  }
}

/**
 * Get all users with their role names from the database.
 *
 * @returns {Promise<UserListView[]>} A promise that resolves to an array of users.
 */
export async function getAllUsers(): Promise<UserListView[]> {
  try {
    const query = `
      SELECT
        u.user_id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.is_active,
        u.created_at,
        r.name AS "roleName" -- Use double quotes to preserve camelCase in the result
      FROM
        users u
      LEFT JOIN
        roles r ON u.role_id = r.role_id
      ORDER BY
        u.created_at DESC;
    `;

    const result = await pool.query(query);

    // The helper function handles arrays, converting each object inside.
    return toCamelCase(result.rows) as UserListView[];
  } catch (error) {
    console.error('Error fetching all users from database:', error);
    throw new Error('Could not retrieve users due to a database error.');
  }
}

/**
 * Get user by ID
 *
 * @param {number} userId - The ID of the user to retrieve.
 * @returns {Promise<RegisteredUser | null>} A promise that resolves to the user object, or null if not found.
 */
export async function getUserById(
  userId: number
): Promise<RegisteredUser | null> {
  try {
    // The query remains the same, selecting snake_case columns
    const query = `
      SELECT
        user_id,
        username,
        email,
        first_name,
        last_name,
        phone_number,
        department,
        profile_image_url,
        role_id,
        is_active,
        created_at,
        updated_at
      FROM
        users
      WHERE
        user_id = $1;
    `;
    const result = await pool.query(query, [userId]);

    // If no rows are returned, the user does not exist.
    if (result.rows.length === 0) {
      return null;
    }

    return toCamelCase(result.rows[0]) as RegisteredUser;
  } catch (error) {
    console.error(
      `Error fetching user with ID ${userId} from database:`,
      error
    );
    throw new Error('Could not retrieve user due to a database error.');
  }
}

/**
 * Partially updates a user's details by their ID using a dynamic query builder.
 * Adopts a whitelist approach for security and a mapping for naming conventions.
 *
 * @param {number} userId - The ID of the user to update.
 * @param {UserUpdateData} updates - An object containing the fields to update.
 * @returns {Promise<RegisteredUser | null>} The updated user object, or null if not found.
 * @throws Will throw an error for invalid fields, uniqueness violations, or other DB errors.
 */
export async function updateUserById(
  userId: number,
  updates: UserUpdateData
): Promise<RegisteredUser | null> {
  // --- PRE-UPDATE CHECKS ---
  if (Object.keys(updates).length === 0) {
    throw new Error('No update data provided.');
  }

  // Whitelist of fields client is allowed to update (now using camelCase)
  const allowedUpdateFields = [
    'username',
    'email',
    'password_plaintext',
    'firstName',
    'lastName',
    'phoneNumber',
    'department',
    'profileImageUrl',
    'roleId',
    'isActive',
  ];

  // Helper to map camelCase application keys to snake_case DB columns
  const mapToDbColumn = (key: string): string => {
    const mapping: { [key: string]: string } = {
      firstName: 'first_name',
      lastName: 'last_name',
      phoneNumber: 'phone_number',
      profileImageUrl: 'profile_image_url',
      roleId: 'role_id',
      isActive: 'is_active',
      password_plaintext: 'password_hash',
    };
    return mapping[key] || key;
  };

  // --- DYNAMIC QUERY BUILDING ---
  const setFields: string[] = [];
  const values: any[] = [];
  let queryIndex = 1;

  for (const key in updates) {
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      // Check if field is in whitelist
      if (!allowedUpdateFields.includes(key)) {
        throw new Error(`Field '${key}' is not updatable.`);
      }

      const value = (updates as any)[key];
      // Skip undefined fields, but allow 'false' and '0'
      if (value === undefined) continue;

      // Check for unique email / username
      if (key === 'email' && value) {
        const existing = await pool.query(
          'SELECT user_id FROM users WHERE email = $1 AND user_id != $2',
          [value, userId]
        );
        if (existing.rows.length > 0)
          throw new Error('Email is already in use by another account.');
      }
      if (key === 'username' && value) {
        const existing = await pool.query(
          'SELECT user_id FROM users WHERE username = $1 AND user_id != $2',
          [value, userId]
        );
        if (existing.rows.length > 0)
          throw new Error('Username is already in use by another account.');
      }

      // Prepare value and column name
      let finalValue = value;
      const dbColumn = mapToDbColumn(key);

      // If password is provided then hash it
      if (key === 'password_plaintext') {
        if (finalValue) {
          finalValue = await bcrypt.hash(finalValue, SALT_ROUNDS);
        } else {
          continue; // Don't add password_hash to SET clause if plaintext is null/empty
        }
      }

      setFields.push(`${dbColumn} = $${queryIndex++}`);
      values.push(finalValue);
    }
  }

  // Check if there's anything to update
  if (setFields.length === 0) {
    throw new Error('No valid fields provided for update.');
  }

  // Add user ID for the WHERE clause
  values.push(userId);

  // Build the query
  const finalQuery = `
    UPDATE users
    SET ${setFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $${queryIndex}
    RETURNING *;
  `;

  // --- EXECUTE QUERY ---
  try {
    const result = await pool.query(finalQuery, values);
    if (result.rowCount === 0) {
      return null; // User not found
    }
    // Convert the snake_case result from DB back to camelCase for the application
    return toCamelCase(result.rows[0]) as RegisteredUser;
  } catch (error) {
    console.error(`Error updating user with ID ${userId}:`, error);
    throw new Error('Could not update user due to a database error.');
  }
}

```


## backend\src\components\user\user.types.ts

```ts
// backend/src/components/user/user.types.ts

// Interface for the data expected for user registration (admin)
export interface AdminCreateUserData {
  username: string;
  email: string;
  password_plaintext: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  roleId: number;
  isActive: boolean;
}

// Interface for getAllUsers user object by admin
export interface UserListView {
  userId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roleName: string;
  isActive: boolean;
  createdAt: Date;
}

// Interface for update of a user by admin
export interface UserUpdateData {
  username?: string;
  email?: string;
  password_plaintext?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  department?: string;
  profileImageUrl?: string;
  roleId?: number;
  isActive?: boolean;
}

```


## backend\src\components\user\user.validation.ts

```ts
// backend/src/components/user/user.validation.ts

import { z } from 'zod';
import { userRegistrationBodySchema } from '../auth/auth.validation';

// Admin - create a user schema
export const createUserByAdminSchema = z.object({
  body: userRegistrationBodySchema.extend({
    roleId: z
      .number({ required_error: 'Role ID is required' })
      .int()
      .positive('Role ID must be a positive integer'),
    isActive: z.boolean({ required_error: 'Active status is required' }),
  }),
});

// Get user by ID schema
export const getUserByIdSchema = z.object({
  params: z.object({
    userId: z.coerce
      .number()
      .int()
      .positive('User ID must be a positive integer.'),
  }),
});

// PUT admin/users/:userId endpoint schema
export const updateUserSchema = z.object({
  params: getUserByIdSchema.shape.params,

  body: createUserByAdminSchema.shape.body.partial(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];

export type CreateUserByAdminInput = z.infer<
  typeof createUserByAdminSchema
>['body'];

```


## backend\src\core\db\index.ts

```ts
import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

// Test connection and log any errors during pool creation or connection
pool.on('connect', () => {
  console.log('Successfully connected to the PostgreSQL database pool');
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  //   process.exit(-1);
});

export default pool;

```


## backend\src\core\middleware\auth.middleware.ts

```ts
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

```


## backend\src\core\middleware\validation.middleware.ts

```ts
// backend/src/core/middleware/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

/**
 * Creates an Express middleware function that validates request data (body, query, params)
 * against a provided Zod schema.
 *
 * If validation is successful, the validated data is attached to the request object
 * (e.g., req.body will be replaced with the validated and transformed body),
 * and the request proceeds to the next handler.
 *
 * If validation fails, a 400 Bad Request response is sent with detailed error messages.
 *
 * @param schema - The Zod schema to validate against. It should be an object schema
 * that can contain 'body', 'query', and/or 'params' Zod object schemas.
 * Example: z.object({ body: z.object({ name: z.string() }) })
 * @returns An Express middleware function.
 */
export const validate =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // If validation is successful replace req properties with validated data
      if (validatedData.body) req.body = validatedData.body;
      if (validatedData.query) req.query = validatedData.query;
      if (validatedData.params) req.params = validatedData.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map(issues => ({
          path: issues.path.join('.'),
          message: issues.message,
        }));
        res.status(400).json({
          error: 'Validation failed.',
          details: errorMessages,
        });
        return;
      }
      // Pass non Zod errors to the next error handler
      console.error('Error is validation middleware (non-Zod):', error);
      res.status(500).json({
        error: 'Internal server error.',
        message: 'An unexpected error occurred during validation.',
      });
      return;
    }
  };

```


## backend\src\core\types\types.ts

```ts
// backend/src/core/types/types.ts

// Interface for the user data returned (excluding password)
export interface RegisteredUser {
  userId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  roleId: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  department?: string | null;
  profileImageUrl?: string | null;
}

```


## backend\src\core\utils\jwt.utils.ts

```ts
import ms from 'ms';

/**
 * Parses the JWT_EXPIRES_IN environment variable to determine the token expiration time in seconds.
 * * This function handles several cases:
 * 1. If JWT_EXPIRES_IN is not set or is an empty string, it defaults to a standard duration (e.g., 1 hour).
 * 2. If JWT_EXPIRES_IN is a string representing a whole number, it's treated as seconds.
 * 3. If JWT_EXPIRES_IN is a time string (e.g., "1h", "7d"), it's converted to seconds using the 'ms' library.
 * * This more explicit parsing is used to ensure a clear `number` type for the 'expiresIn' option
 * of `jwt.sign()`, which helps satisfy strict TypeScript type checking that was encountered
 * with more direct string manipulation from environment variables. It also includes warnings
 * for invalid formats and falls back to a default.
 * * @returns {number} The token expiration time in seconds.
 */
export const getJwtExpiresInSeconds = (): number => {
  const envVal = process.env.JWT_EXPIRES_IN?.trim();
  const defaultSeconds = 3600;

  if (!envVal) {
    return defaultSeconds;
  }

  // Try parsing as a direct number of seconds
  const parsedAsInt = parseInt(envVal, 10);
  if (!isNaN(parsedAsInt) && parsedAsInt.toString() === envVal) {
    return parsedAsInt;
  }

  // Try parsing as a time string
  try {
    // Using 'as any' as a pragmatic workaround for potential strict StringValue type issues with ms()
    const milliseconds = ms(envVal as any);
    if (typeof milliseconds === 'number' && !isNaN(milliseconds)) {
      return milliseconds / 1000; // Convert ms to seconds
    }
  } catch (e) {
    // Log error if ms parsing fails catastrophically, but still fall back
    console.error(
      `[AuthService] Error while parsing JWT_EXPIRES_IN string with ms library: "${envVal}"`,
      e
    );
  }

  // Fallback if format is not recognized by ms() or if ms() returned an unexpected type
  console.error(
    `[AuthService] Invalid or unparseable JWT_EXPIRES_IN format: "${envVal}". Defaulting to ${defaultSeconds / 3600}h.`
  );
  return defaultSeconds;
};

```


## backend\src\core\utils\object.utils.ts

```ts
// backend/src/core/utils/object.utils.ts

/**
 * Converts a single string from snake_case to camelCase.
 * @param {string} str The string to convert.
 * @returns {string} The camelCased string.
 */
const toCamel = (str: string): string => {
  return str.replace(/([-_][a-z])/gi, $1 => {
    return $1.toUpperCase().replace('-', '').replace('_', '');
  });
};

/**
 * Converts all keys of an object from snake_case to camelCase.
 * This is useful for translating data from the database to the application layer.
 * @param {object} obj The object to convert.
 * @returns {object} A new object with camelCased keys.
 */
export const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => toCamelCase(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [toCamel(key)]: toCamelCase(obj[key]),
      }),
      {}
    );
  }
  return obj;
};

```


## backend\src\server.ts

```ts
// db/index.ts was calling .env before app.ts and causing
// errors so moved dotenv import and config call to here
import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import http from 'http';
import pool from './core/db';

// Get port from environment variables or default to 8000
const PORT: string | number = process.env.PORT || 8000;

// Create an HTTP server
const server = http.createServer(app);

// Start the server
server.listen(PORT, async () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
  console.log(`Current environment: ${process.env.NODE_ENV || 'development'}`);
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log(
      '+++ [SERVER] DB Connection Test Successful! PostgreSQL current time:',
      result.rows[0].now
    );
    client.release();
  } catch (error) {
    console.error('!!! [SERVER] DB Connection Test Failed on startup:', error);
  }
});

```


## backend\test.js

```js
/**
 * Authentication Service Layer (JavaScript)
 * 
 * Contains the core business logic for authentication operations, including
 * database interactions, password hashing, and JWT token management.
 * 
 * @file backend/src/components/auth/auth.service.js
 */

const pool = require('../../core/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Database queries
const QUERIES = {
  FIND_USER: `
    SELECT user_id, username, email, role_id, password_hash, is_active 
    FROM users 
    WHERE email = $1 OR username = $1
  `,
  CHECK_EXISTING: `SELECT user_id FROM users WHERE username = $1 OR email = $2`,
  INSERT_USER: `
    INSERT INTO users (username, email, password_hash, first_name, last_name, phone_number)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING user_id, username, email, first_name, last_name, phone_number, role_id, is_active, created_at, updated_at
  `
};

// Configuration
const CONFIG = {
  get JWT_SECRET() {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    return process.env.JWT_SECRET;
  },
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12
};

// Custom errors
class AuthError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

// Utility functions
const sanitizeInput = {
  email: (email) => email.trim().toLowerCase(),
  username: (username) => username.trim().toLowerCase(),
  general: (input) => input.trim()
};

const handleDatabaseError = (error, operation) => {
  console.error(`Database error during ${operation}:`, error);
  
  if (error.code === '23505') {
    throw new AuthError('Username or email already exists.');
  }
  
  throw new Error(`${operation} failed due to database error.`);
};

const generateJwtToken = (userId, roleId) => {
  const payload = { userId, roleId };
  return jwt.sign(payload, CONFIG.JWT_SECRET, {
    expiresIn: CONFIG.JWT_EXPIRES_IN,
    issuer: 'helpdesk-api'
  });
};

// Main functions
const loginUser = async (loginData) => {
  const { emailOrUsername, password_plaintext } = loginData;
  const sanitizedInput = sanitizeInput.general(emailOrUsername);

  if (!sanitizedInput || !password_plaintext) {
    throw new AuthError('Email/username and password are required.');
  }

  try {
    const userResult = await pool.query(QUERIES.FIND_USER, [sanitizedInput]);

    if (userResult.rows.length === 0) {
      throw new AuthError('Invalid email/username or password.');
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      throw new AuthError('Account is inactive. Please contact support.');
    }

    const passwordMatches = await bcrypt.compare(password_plaintext, user.password_hash);

    if (!passwordMatches) {
      throw new AuthError('Invalid email/username or password.');
    }

    const token = generateJwtToken(user.user_id, user.role_id);

    return {
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role_id: user.role_id,
      },
    };
  } catch (error) {
    if (error instanceof AuthError) throw error;
    handleDatabaseError(error, 'user login');
  }
};

const registerNewUser = async (userData) => {
  const { username, email, password_plaintext, first_name, last_name, phone_number } = userData;

  // Sanitize inputs
  const sanitizedData = {
    username: sanitizeInput.username(username),
    email: sanitizeInput.email(email),
    first_name: sanitizeInput.general(first_name),
    last_name: sanitizeInput.general(last_name),
    phone_number: sanitizeInput.general(phone_number)
  };

  // Validate required fields
  if (!sanitizedData.username || !sanitizedData.email || !password_plaintext || 
      !sanitizedData.first_name || !sanitizedData.last_name || !sanitizedData.phone_number) {
    throw new AuthError('All fields are required.');
  }

  if (password_plaintext.length < 8) {
    throw new AuthError('Password must be at least 8 characters long.');
  }

  try {
    // Check existing user
    const existingResult = await pool.query(QUERIES.CHECK_EXISTING, [
      sanitizedData.username, 
      sanitizedData.email
    ]);

    if (existingResult.rows.length > 0) {
      throw new AuthError('Username or email already exists.');
    }

    // Hash password and insert user
    const password_hash = await bcrypt.hash(password_plaintext, CONFIG.SALT_ROUNDS);
    const values = [
      sanitizedData.username,
      sanitizedData.email,
      password_hash,
      sanitizedData.first_name,
      sanitizedData.last_name,
      sanitizedData.phone_number,
    ];

    const newUserResult = await pool.query(QUERIES.INSERT_USER, values);
    
    if (newUserResult.rows.length === 0) {
      throw new Error('User registration failed.');
    }

    return newUserResult.rows[0];
  } catch (error) {
    if (error instanceof AuthError) throw error;
    handleDatabaseError(error, 'user registration');
  }
};

const validateAuthConfig = () => {
  try {
    CONFIG.JWT_SECRET; // This will throw if missing
    console.log('✅ Authentication configuration validated');
  } catch (error) {
    console.error('❌ Authentication configuration failed:', error.message);
    throw error;
  }
};

module.exports = {
  loginUser,
  registerNewUser,
  validateAuthConfig,
  AuthError
};
```


## sql\01_full_schema.sql

```
-- =============================================================================
-- Help Desk Ticket System - Full Database Schema (Version 1.2)
-- Last Updated: 2025-05-30
--
-- This script creates all necessary custom types, tables, relationships,
-- and automation (triggers) for the core database structure.
-- It is designed to be re-runnable
-- =============================================================================

-- =============================================================================
-- SECTION 1: Custom Data Type Definitions (ENUMs)
-- Defining ENUM types to ensure data integrity and consistency for
-- ticket status, priority, and category fields.
-- These are created first as they are prerequisites for the 'tickets' table.
-- =============================================================================

-- Extension for trigram index warning
-- CREATE EXTENSION IF NOT EXISTS pg_trgm; --Comment out / Uncomment 

-- Drop existing types if they exist
DROP TYPE IF EXISTS ticket_status_enum CASCADE;
DROP TYPE IF EXISTS ticket_priority_enum CASCADE;
DROP TYPE IF EXISTS ticket_category_enum CASCADE;
DROP TYPE IF EXISTS kb_article_status_enum CASCADE;

CREATE TYPE ticket_status_enum AS ENUM (
    'Open',
    'In Progress',
    'Pending Customer',
    'Resolved',
    'Closed'
);
COMMENT ON TYPE ticket_status_enum IS 'Defines the allowed workflow statuses for a ticket';

CREATE TYPE ticket_priority_enum AS ENUM (
    'Low',
    'Medium',
    'High',
    'Urgent'
);
COMMENT ON TYPE ticket_priority_enum IS 'Defines the allowed priority levels for a ticket';

CREATE TYPE ticket_category_enum AS ENUM (
    'Hardware Issue',
    'Software Issue',
    'Network Access',
    'Account & Access',
    'Resource Request',
    'Facilities Support',
    'HR & Admin Inquiry',
    'General IT Support'
);
COMMENT ON TYPE ticket_category_enum IS 'Defines the allowed categories for classifying a ticket';

CREATE TYPE kb_article_status_enum AS ENUM (
    'Draft',
    'Published',
    'Archived'
);
COMMENT ON TYPE kb_article_status_enum IS 'Defines the workflow statuses for a knowledge base article';

-- =============================================================================
-- SECTION 2: Table Definitions
-- Order of creation matters due to foreign key dependencies
-- 1. roles
-- 2. users (depends on roles)
-- 3. tickets (depends on users and ENUMs)
-- 4. ticket_attachments (depends on tickets)
-- =============================================================================

-- =============================================================================
-- Table: roles
-- Stores the different user roles within the system
-- =============================================================================
DROP TABLE IF EXISTS roles CASCADE;
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO roles (role_id, name) VALUES
(1, 'Admin'),
(2, 'User'),
(3, 'Agent')
ON CONFLICT (role_id) DO NOTHING;

COMMENT ON TABLE roles IS 'Stores the different user roles';
COMMENT ON COLUMN roles.role_id IS 'Unique auto-incrementing identifier for the role';
COMMENT ON COLUMN roles.name IS 'The unique name of the role';

-- =============================================================================
-- Table: users
-- Stores the account details, credentials, and profile information
-- =============================================================================
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(512) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(30) NOT NULL
        CHECK (phone_number ~ '^[\+]?[0-9\s\-\(\)]{7,30}$'),
    department VARCHAR(100) NULL,
    profile_image_url VARCHAR(512) NULL,
    role_id INTEGER NOT NULL DEFAULT 2, -- User
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_role FOREIGN KEY(role_id) REFERENCES roles(role_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

COMMENT ON TABLE users IS 'Stores user account information, credentials, and profile details';
COMMENT ON COLUMN users.user_id IS 'Unique auto-incrementing identifier for the user';
COMMENT ON COLUMN users.username IS 'User''s unique login identifier';
COMMENT ON COLUMN users.email IS 'User''s unique email address (for communication, password resets)';
COMMENT ON COLUMN users.password_hash IS 'Securely hashed version of the user''s password';
COMMENT ON COLUMN users.first_name IS 'User''s first name';
COMMENT ON COLUMN users.last_name IS 'User''s last name';
COMMENT ON COLUMN users.phone_number IS 'User''s phone number';
COMMENT ON COLUMN users.department IS 'User''s department (optional)';
COMMENT ON COLUMN users.profile_image_url IS 'URL to the user''s profile picture in cloud storage (optional)';
COMMENT ON COLUMN users.role_id IS 'Foreign key referencing roles.role_id, linking user to their role. Defaults to ''User''';
COMMENT ON COLUMN users.is_active IS 'Indicates if the user account is active (TRUE) or disabled (FALSE). Defaults to TRUE';
COMMENT ON COLUMN users.created_at IS 'Timestamp of when the user account was created';
COMMENT ON COLUMN users.updated_at IS 'Timestamp of when the user account was last updated (automatically managed by a trigger)';

-- =============================================================================
-- Table: tickets
-- Stores information about support tickets
-- =============================================================================
DROP TABLE IF EXISTS tickets CASCADE;
CREATE TABLE tickets (
    ticket_id SERIAL PRIMARY KEY,
    requester_user_id INTEGER NOT NULL,
    assignee_user_id INTEGER NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status ticket_status_enum NOT NULL DEFAULT 'Open',
    priority ticket_priority_enum NOT NULL DEFAULT 'Medium',
    category ticket_category_enum NOT NULL DEFAULT 'General IT Support',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date DATE NULL,
    resolved_at TIMESTAMPTZ NULL,
    first_response_due_at TIMESTAMPTZ NULL,
    resolution_due_at TIMESTAMPTZ NULL,
    first_responded_at TIMESTAMPTZ NULL,
    sla_status VARCHAR(50) null,
    CONSTRAINT fk_ticket_requester FOREIGN KEY(requester_user_id) REFERENCES users(user_id)
        ON DELETE RESTRICT -- Prevent deleting a user if they have submitted tickets
        ON UPDATE CASCADE,
    CONSTRAINT fk_ticket_assignee FOREIGN KEY(assignee_user_id) REFERENCES users(user_id)
        ON DELETE SET NULL -- If an assigned user is deleted the ticket becomes unassigned
        ON UPDATE CASCADE
);
COMMENT ON TABLE tickets IS 'Stores information about support tickets for the internal help desk system';
COMMENT ON COLUMN tickets.ticket_id IS 'Unique auto-incrementing identifier for the ticket';
COMMENT ON COLUMN tickets.requester_user_id IS 'Foreign key referencing users.user_id, indicating who submitted the ticket';
COMMENT ON COLUMN tickets.assignee_user_id IS 'Foreign key referencing users.user_id, indicating who is assigned to the ticket (optional)';
COMMENT ON COLUMN tickets.subject IS 'A brief title or summary of the ticket/issue';
COMMENT ON COLUMN tickets.description IS 'Detailed description of the issue or request. Defaults to an empty string if not provided';
COMMENT ON COLUMN tickets.status IS 'The current workflow status of the ticket (e.g., Open, In Progress)';
COMMENT ON COLUMN tickets.priority IS 'The urgency or importance level of the ticket (e.g., Low, Medium, High)';
COMMENT ON COLUMN tickets.category IS 'The classification of the ticket for internal support';
COMMENT ON COLUMN tickets.created_at IS 'Timestamp (with time zone) indicating when the ticket was created';
COMMENT ON COLUMN tickets.updated_at IS 'Timestamp (with time zone) indicating when the ticket was last updated (automatically managed by a trigger)';
COMMENT ON COLUMN tickets.due_date IS 'Optional target date by which the ticket should ideally be resolved';
COMMENT ON COLUMN tickets.resolved_at IS 'Timestamp (with time zone) indicating when the ticket was marked as resolved. NULL if not yet resolved';
COMMENT ON COLUMN tickets.first_response_due_at IS 'Calculated target time for the first agent response based on SLA policy (V1)';
COMMENT ON COLUMN tickets.resolution_due_at IS 'Calculated target time for ticket resolution based on SLA policy (V1)';
COMMENT ON COLUMN tickets.first_responded_at IS 'Actual timestamp of the first public response made by an agent (V1)';
COMMENT ON COLUMN tickets.sla_status IS 'Simple status indicating if SLA targets (TTFR/TTR) are met, breached, or pending (V1)';

-- =============================================================================
-- Table: ticket_comments
-- Stores comments and notes related to tickets
-- =============================================================================
DROP TABLE IF EXISTS ticket_comments CASCADE;
CREATE TABLE ticket_comments (
    comment_id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL, -- User who wrote the comment
    comment_text TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT FALSE, -- FALSE for public, TRUE for internal agent/admin notes
    parent_comment_id INTEGER NULL, -- For threading replies to other comments
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL, -- Timestamp of when the comment was last edited
    first_viewed_by_agent_at TIMESTAMPTZ NULL, -- For edit/delete rule: when an agent first saw this comment

    CONSTRAINT fk_comment_ticket FOREIGN KEY(ticket_id) REFERENCES tickets(ticket_id)
        ON DELETE CASCADE, -- If a ticket is deleted, its comments are also deleted
    CONSTRAINT fk_comment_user FOREIGN KEY(user_id) REFERENCES users(user_id)
        ON DELETE RESTRICT, -- Prevent deleting a user if they have made comments
    CONSTRAINT fk_comment_parent FOREIGN KEY(parent_comment_id) REFERENCES ticket_comments(comment_id)
        ON DELETE SET NULL -- If a parent comment is deleted, its replies become top-level
);

COMMENT ON TABLE ticket_comments IS 'Stores comments, replies, and internal notes associated with tickets';
COMMENT ON COLUMN ticket_comments.comment_id IS 'Unique auto-incrementing identifier for the comment';
COMMENT ON COLUMN ticket_comments.ticket_id IS 'Foreign key referencing tickets.ticket_id';
COMMENT ON COLUMN ticket_comments.user_id IS 'Foreign key referencing users.user_id, indicating who wrote the comment';
COMMENT ON COLUMN ticket_comments.comment_text IS 'The actual content of the comment or note';
COMMENT ON COLUMN ticket_comments.is_internal IS 'TRUE if the comment is an internal note (agents/admins only), FALSE if public (visible to requester)';
COMMENT ON COLUMN ticket_comments.parent_comment_id IS 'If this is a reply, references the comment_id of the parent comment';
COMMENT ON COLUMN ticket_comments.created_at IS 'Timestamp of when the comment was created';
COMMENT ON COLUMN ticket_comments.updated_at IS 'Timestamp of when the comment was last edited';
COMMENT ON COLUMN ticket_comments.first_viewed_by_agent_at IS 'Timestamp when an agent first viewed a non-internal comment, relevant for edit/delete permissions';

-- -----------------------------------------------------------------------------
-- Table: ticket_attachments
-- Stores information about files attached to tickets.
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS ticket_attachments CASCADE;
CREATE TABLE ticket_attachments (
    attachment_id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL,
    uploader_user_id INTEGER NOT NULL,
    file_url VARCHAR(512) NOT NULL,
    file_name VARCHAR(255) NULL,
    file_type VARCHAR(100) NULL,
    file_size INTEGER NULL, --Size in bytes
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_attachment_ticket FOREIGN KEY(ticket_id) REFERENCES tickets(ticket_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_attachment_uploader FOREIGN KEY(uploader_user_id) REFERENCES users(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

COMMENT ON TABLE ticket_attachments IS 'Stores references to files attached to tickets, with links to cloud storage';
COMMENT ON COLUMN ticket_attachments.attachment_id IS 'Unique auto-incrementing identifier for the attachment';
COMMENT ON COLUMN ticket_attachments.ticket_id IS 'Foreign key referencing tickets.ticket_id, linking the attachment to a specific ticket';
COMMENT ON COLUMN ticket_attachments.uploader_user_id IS 'Foreign key referencing users.user_id, linking the attachment to a specific user';
COMMENT ON COLUMN ticket_attachments.file_url IS 'URL to the actual file stored in cloud storage';
COMMENT ON COLUMN ticket_attachments.file_name IS 'Original name of the uploaded file (optional)';
COMMENT ON COLUMN ticket_attachments.file_type IS 'MIME type of the file (e.g., ''image/jpeg'', ''application/pdf'') (optional)';
COMMENT ON COLUMN ticket_attachments.file_size IS 'Size of the uploaded file in bytes (optional)';
COMMENT ON COLUMN ticket_attachments.uploaded_at IS 'Timestamp indicating when the file was uploaded';

-- =============================================================================
-- Table: password_reset_tokens
-- Stores tokens for user password reset requests
-- =============================================================================
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
CREATE TABLE password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_password_reset_user FOREIGN KEY(user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
);

COMMENT ON TABLE password_reset_tokens IS 'Stores tokens for user password reset requests, linking them to users and defining an expiry time.';
COMMENT ON COLUMN password_reset_tokens.id IS 'Unique auto-incrementing identifier for the token record.';
COMMENT ON COLUMN password_reset_tokens.user_id IS 'Foreign key referencing the user who requested the reset.';
COMMENT ON COLUMN password_reset_tokens.token_hash IS 'A secure hash of the password reset token sent to the user. The actual token is not stored.';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'Timestamp indicating when this reset token will no longer be valid.';
COMMENT ON COLUMN password_reset_tokens.created_at IS 'Timestamp indicating when the token record was created.';

-- =============================================================================
-- Table: kb_categories
-- Stores categories for organizing knowledge base articles
-- =============================================================================
DROP TABLE IF EXISTS kb_categories CASCADE;
CREATE TABLE kb_categories (
    kb_category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL
);

COMMENT ON TABLE kb_categories IS 'Stores categories for organizing knowledge base articles';
COMMENT ON COLUMN kb_categories.kb_category_id IS 'Unique auto-incrementing identifier for the category';
COMMENT ON COLUMN kb_categories.name IS 'The unique name of the category';
COMMENT ON COLUMN kb_categories.description IS 'Optional description for the category';

-- =============================================================================
-- Table: kb_articles
-- Stores knowledge base articles
-- =============================================================================
DROP TABLE IF EXISTS kb_articles CASCADE;
CREATE TABLE kb_articles (
    article_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,  -- Store as markdown
    kb_category_id INTEGER NULL,
    author_user_id INTEGER NOT NULL, -- User (Agent/Admin) who authored/owns the article
    status kb_article_status_enum NOT NULL DEFAULT 'Draft',
    keywords TEXT NULL, -- Comma separated keywords or tags for search
    view_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_kb_article_category FOREIGN KEY(kb_category_id) REFERENCES kb_categories(kb_category_id)
        ON DELETE SET NULL, -- If category is deleted, article becomes uncategorized
    CONSTRAINT fk_kb_article_author FOREIGN KEY(author_user_id) REFERENCES users(user_id)
        ON DELETE RESTRICT -- Prevent deleting a user if they authored articles
        ON UPDATE CASCADE
);

COMMENT ON TABLE kb_articles IS 'Stores knowledge base articles for self-service and agent assistance';
COMMENT ON COLUMN kb_articles.article_id IS 'Unique auto-incrementing identifier for the article';
COMMENT ON COLUMN kb_articles.title IS 'The title of the knowledge base article';
COMMENT ON COLUMN kb_articles.content IS 'The main content of the article, Markdown recommended';
COMMENT ON COLUMN kb_articles.kb_category_id IS 'Foreign key linking to the kb_categories table';
COMMENT ON COLUMN kb_articles.author_user_id IS 'Foreign key linking to the users table, indicating the article author';
COMMENT ON COLUMN kb_articles.status IS 'Current status of the article (Draft, Published, Archived)';
COMMENT ON COLUMN kb_articles.keywords IS 'Comma-separated keywords for simple search functionality';
COMMENT ON COLUMN kb_articles.view_count IS 'Counter for how many times the article has been viewed';
COMMENT ON COLUMN kb_articles.created_at IS 'Timestamp of when the article was created';
COMMENT ON COLUMN kb_articles.updated_at IS 'Timestamp of when the article was last updated (should be auto-managed by a trigger)';

-- =============================================================================
-- SECTION 3: Automation - Triggers for 'updated_at' Timestamps
-- This function and associated triggers ensure that the 'updated_at'
-- column is automatically updated whenever a row in the specified
-- tables ('users', 'tickets') is modified.
-- =============================================================================

-- Drop existing function and triggers if they exist
DROP FUNCTION IF EXISTS fn_update_timestamp() CASCADE;

-- Generic function to update the 'updated_at' column of any table that has it.
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION fn_update_timestamp() IS 'Generic trigger function to set the updated_at column to the current timestamp upon row modification';

-- Trigger for 'users' table
CREATE TRIGGER trg_users_update_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION fn_update_timestamp();
COMMENT ON TRIGGER trg_users_update_timestamp ON users IS 'Automatically updates users.updated_at on row modification';

-- Trigger for 'tickets' table
CREATE TRIGGER trg_tickets_update_timestamp
BEFORE UPDATE ON tickets
FOR EACH ROW
EXECUTE FUNCTION fn_update_timestamp();
COMMENT ON TRIGGER trg_tickets_update_timestamp ON tickets IS 'Automatically updates tickets.updated_at on row modification.';

-- Trigger for 'kb_articles' table
CREATE TRIGGER trg_kb_articles_timestamp
BEFORE UPDATE ON kb_articles
FOR EACH ROW
EXECUTE FUNCTION fn_update_timestamp();
COMMENT ON TRIGGER trg_kb_articles_timestamp ON kb_articles IS 'Automatically updates kb_articles.updated_at on row modification';

-- =============================================================================
-- SECTION 4: Performance Indexes
-- These indexes optimize common querry patterns
-- Created after all tables and constraints to avoid dependency issues
-- =============================================================================

-- =============================================================================
-- Single column indexes
-- =============================================================================


-- users table indexes
-- CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
-- CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
-- CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);

-- tickets table indexes
-- CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets (status);
-- CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets (priority);
-- CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets (category);

-- Tickets table indexes - Foreign Keys (essential for JOINs)
-- CREATE INDEX IF NOT EXISTS idx_tickets_requester_user_id ON tickets (requester_user_id);
-- CREATE INDEX IF NOT EXISTS idx_tickets_assignee_user_id ON tickets (assignee_user_id);

-- Tickets table indexes - Date/Time columns (reporting and sorting)
-- CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets (created_at);
-- CREATE INDEX IF NOT EXISTS idx_tickets_updated_at ON tickets (updated_at);
-- CREATE INDEX IF NOT EXISTS idx_tickets_due_date ON tickets (due_date);
-- CREATE INDEX IF NOT EXISTS idx_tickets_resolved_at ON tickets (resolved_at);

-- Ticket attachments indexes
-- CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket_id ON ticket_attachments (ticket_id);
-- CREATE INDEX IF NOT EXISTS idx_ticket_attachments_uploaded_at ON ticket_attachments (uploaded_at);

-- -----------------------------------------------------------------------------
-- Composite Indexes - Optimized Query Patterns
-- -----------------------------------------------------------------------------

-- Agent dashboard: "Show me my open/in progress tickets"
-- CREATE INDEX IF NOT EXISTS idx_tickets_assignee_status ON tickets (assignee_user_id, status);

-- Priority dashboard: "Show urgent tickets by status"
-- CREATE INDEX IF NOT EXISTS idx_tickets_priority_status ON tickets (priority, status);

-- Time-based status reporting: "Open tickets created this month"
-- CREATE INDEX IF NOT EXISTS idx_tickets_status_created_at ON tickets (status, created_at);

-- Department reporting: "Hardware issues by status"
-- CREATE INDEX IF NOT EXISTS idx_tickets_category_status ON tickets (category, status);

-- SLA monitoring: "Overdue tickets by priority"
-- CREATE INDEX IF NOT EXISTS idx_tickets_due_date_priority ON tickets (due_date, priority);

-- Resolution time analysis: "Resolved tickets with times"
-- CREATE INDEX IF NOT EXISTS idx_tickets_resolved_at_created_at ON tickets (resolved_at, created_at) 
-- WHERE resolved_at IS NOT NULL;

-- -----------------------------------------------------------------------------
-- Specialized Indexes
-- -----------------------------------------------------------------------------

-- Partial index for unassigned tickets (common dashboard view)
-- CREATE INDEX IF NOT EXISTS idx_tickets_unassigned ON tickets (created_at, priority) 
-- WHERE assignee_user_id IS NULL;

-- Partial index for overdue tickets (critical monitoring)  
-- CREATE INDEX IF NOT EXISTS idx_tickets_overdue ON tickets (due_date, priority) 
-- WHERE due_date < CURRENT_DATE AND status NOT IN ('Resolved', 'Closed');

-- Text search on subject (basic search functionality)
-- CREATE INDEX IF NOT EXISTS idx_tickets_subject_trgm ON tickets USING gin (subject gin_trgm_ops);
-- Note: Requires CREATE EXTENSION pg_trgm; for trigram similarity

-- Comments explaining index strategy
-- COMMENT ON INDEX idx_tickets_assignee_status IS 'Optimizes agent dashboard queries for assigned tickets by status';
-- COMMENT ON INDEX idx_tickets_priority_status IS 'Optimizes urgent/high priority ticket filtering and reporting';
-- COMMENT ON INDEX idx_tickets_unassigned IS 'Partial index for unassigned ticket queue, filtered to reduce index size';
-- COMMENT ON INDEX idx_tickets_overdue IS 'Partial index for overdue ticket monitoring';

-- =============================================================================
-- End of Schema Script
-- =============================================================================
```


## sql\02_seed_data.sql

```
-- =============================================================================
-- 02_seed_data.sql
-- Populates the database with sample data for development and testing.
-- Roles seeded by DDL: (1, 'Admin'), (2, 'User'), (3, 'Agent')
-- =============================================================================

-- =============================================================================
-- SECTION 1: Seed Users
-- =============================================================================
INSERT INTO users (
    username, email, password_hash,
    first_name, last_name, phone_number,
    department, profile_image_url, role_id, 
    is_active
) VALUES
(
    'admin_adeline', 'admin.adeline@helpdesk.example.com', '$2b$10$K7zL9NfH0xL8gP6vY3iE7O4jJ2mS5nB1cR9gH2vX1zL0kY3jF4aBc',
    'Adeline', 'Ministrator', '+1-555-0100',
    'IT Operations', NULL,
    1, TRUE -- role_id 1: Admin
),
(
    'agent_jane', 'jane.doe@helpdesk.example.com', '$2b$10$A1bC2dE3fG4hI5jK6lM7nO8pQ9rS0tU1vW2xY3zZaBcDeFgHiJkL', -- Placeholder hash for "password_jane"
    'Jane', 'Doe', '+1-555-0101',
    'Support Team Alpha', 'https://example.com/profiles/jane_doe.jpg',
    3, TRUE -- role_id 3: Agent
),
(
    'agent_mike', 'mike.roe@helpdesk.example.com', '$2b$10$Z0yX9wV8uT7sR6qP5oN4mEl3kJf2hGg1fDcBaS1vY2z0xL9jK8iHg', -- Placeholder hash for "password_mike"
    'Mike', 'Roe', '+1-555-0102',
    'Support Team Bravo', NULL,
    3, FALSE -- role_id 3: Agent, INACTIVE
),
(
    'user_john', 'john.smith@company.example.com', '$2b$10$P4oQ5rS6tU7vW8xY9zZaBcDeFgHiJkLmN1oP2qR3sT4uV5wX6yZ7a', -- Placeholder hash for "password_john"
    'John', 'Smith', '+1-555-0103',
    'Marketing', 'https://example.com/profiles/john_smith.jpg',
    2, TRUE -- role_id 2: User
),
(
    'user_alice', 'alice.w@company.example.com', '$2b$10$S0tU1vW2xY3zZaBcDeFgHiJkLmN1oP2qR3sT4uV5wX6yZ7aP4oQ5r', -- Placeholder hash for "password_alice"
    'Alice', 'Wonder', '+1-555-0104',
    'Sales', NULL,
    2, TRUE -- role_id 2: User
);

-- =============================================================================
-- SECTION 2: Seed Tickets
-- (Assumes user_ids 1-5 correspond to Adeline, Jane, Mike, John, Alice)
-- =============================================================================
INSERT INTO tickets (
    requester_user_id, assignee_user_id, subject,
    description, status, priority, category, 
    created_at, updated_at, due_date, resolved_at,
    first_response_due_at, resolution_due_at,
    first_responded_at, sla_status
) VALUES
(
    -- Ticket 1: John (User), Unassigned, Medium Priority
    4, NULL, 'Cannot access shared drive', 
    'I''m trying to access the Marketing shared drive (M://) but keep getting an access denied error. Worked fine yesterday.',
    'Open', 'Medium', 'Network Access',
    NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', NOW() + INTERVAL '3 days', NULL,
    (NOW() - INTERVAL '2 hours') + INTERVAL '8 hours', (NOW() - INTERVAL '2 hours') + INTERVAL '48 hours', NULL, 'Pending' -- (SLA V1)
),
(
    -- Ticket 2: Alice (User), Assigned to Jane (Agent), Urgent Priority
    5, 2, 'Email not sending - CRITICAL for client demo!', 
    'My Outlook is stuck. I have a client demo in 1 hour and need to send them the proposal. Urgent help needed!',
    'Open', 'Urgent', 'Software Issue',
    NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes', NOW() + INTERVAL '1 hour', NULL,
    (NOW() - INTERVAL '30 minutes') + INTERVAL '2 hours', (NOW() - INTERVAL '30 minutes') + INTERVAL '8 hours', NULL, 'Pending' -- (SLA V1)
),
(
    -- Ticket 3: John (User), Assigned to Jane (Agent), High Priority
    4, 2, 'Printer in Building B offline', 
    'The main printer on the 2nd floor of Building B is showing an error code E505 and won''t print.',
    'In Progress', 'High', 'Hardware Issue',
    NOW() - INTERVAL '1 day', NOW() - INTERVAL '4 hours', NOW() + INTERVAL '1 day', NULL,
    (NOW() - INTERVAL '1 day') + INTERVAL '4 hours', (NOW() - INTERVAL '1 day') + INTERVAL '24 hours', NULL, 'TTFR Breached, TTR Pending' -- (SLA V1)
),
(
    -- Ticket 4: Adeline (Admin), Assigned to Jane (Agent), Medium Priority
    1, 2, 'Request for new software license - Follow Up', 
    'Following up on my request for a license for ''DesignPro X''. Agent Jane asked for department approval, which I will upload as an attachment.',
    'Pending Customer', 'Medium', 'Resource Request',
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day', NULL, NULL,
    (NOW() - INTERVAL '3 days') + INTERVAL '8 hours', (NOW() - INTERVAL '3 days') + INTERVAL '48 hours', (NOW() - INTERVAL '3 days') + INTERVAL '1 hour', 'TTFR Met, TTR Breached' -- (SLA V1)
),
(
    -- Ticket 5: Alice (User), Assigned to Jane (Agent), Medium Priority, Resolved
    5, 2, 'Password reset for internal portal', 
    'Locked myself out of the benefits portal. Can I get a reset?',
    'Resolved', 'Medium', 'Account & Access',
    NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', NULL, NOW() - INTERVAL '4 days', -- Resolved 4 days ago
    (NOW() - INTERVAL '5 days') + INTERVAL '8 hours', (NOW() - INTERVAL '5 days') + INTERVAL '48 hours', (NOW() - INTERVAL '5 days') + INTERVAL '1 hour', 'TTFR Met, TTR Met' -- (SLA V1)
),
(
    -- Ticket 6: John (User), Assigned to Jane (Agent), Low Priority, Closed
    4, 2, 'Laptop running slow - initial query', 
    'My laptop has been very sluggish for the past week, especially when opening large files.',
    'Closed', 'Low', 'Hardware Issue',
    NOW() - INTERVAL '45 days', NOW() - INTERVAL '40 days', NULL, NOW() - INTERVAL '40 days', -- Closed 40 days ago
    (NOW() - INTERVAL '45 days') + INTERVAL '24 hours', (NOW() - INTERVAL '45 days') + INTERVAL '120 hours', (NOW() - INTERVAL '45 days') + INTERVAL '10 hours', 'TTFR Met, TTR Met' -- (SLA V1)
),
(
    -- Ticket 7: Adeline (Admin), Unassigned, Urgent Priority
    1, NULL, 'Server room temperature alert', 
    'Received an automated alert that the server room temperature is above recommended levels. Needs immediate investigation.',
    'Open', 'Urgent', 'Hardware Issue',
    NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '5 minutes', NOW() + INTERVAL '4 hours', NULL,
    (NOW() - INTERVAL '5 minutes') + INTERVAL '2 hours', (NOW() - INTERVAL '5 minutes') + INTERVAL '8 hours', NULL, 'Pending' -- (SLA V1)
);

-- =============================================================================
-- SECTION 3: Seed Ticket Attachments
-- (Assumes ticket_ids 1-7 correspond to the tickets inserted above in order)
-- =============================================================================
INSERT INTO ticket_attachments (
    ticket_id, uploader_user_id, file_url, file_name, file_type, file_size, uploaded_at
) VALUES
(
    -- Attachment for Ticket 1: "Cannot access shared drive" (Ticket Requester: John, user_id=4)
    1, 4, 
    '/uploads/seed_data/ticket_1/access_denied_M_drive.jpg', 
    'access_denied_M_drive.jpg',
    'image/jpeg',
    90 * 1024, -- 90KB
    NOW() - INTERVAL '2 hours' -- Same as ticket creation
),
(
    -- Attachment for Ticket 2: "Email not sending - CRITICAL..." (Ticket Requester: Alice, user_id=5)
    2, 5,
    '/uploads/seed_data/ticket_2/outlook_error_screenshot.png', 
    'outlook_error_screenshot.png',
    'image/png',
    120 * 1024, -- 120KB
    NOW() - INTERVAL '30 minutes' -- Same as ticket creation
),
(
    -- Attachment for Ticket 4: "Request for new software license..." (Ticket Requester: Adeline, user_id=1)
    4, 1,
    '/uploads/seed_data/ticket_4/Department_Approval_DesignProX.pdf', 
    'Department_Approval_DesignProX.pdf',
    'application/pdf',
    250 * 1024, -- 250KB
    NOW() - INTERVAL '1 day' -- Same as when ticket was last updated by Adeline
);

-- =============================================================================
-- SECTION 4: Seed Ticket Comments
-- =============================================================================
INSERT INTO ticket_comments (
    ticket_id, user_id, comment_text, is_internal, parent_comment_id, created_at, updated_at, first_viewed_by_agent_at
) VALUES
(
    -- Comment 1: On Ticket 1 (Requester: John, user_id=4)
    1, 4, 'Just wanted to add that this also affects my colleague, Bob. Any updates?',
    FALSE, NULL, NOW() - INTERVAL '1 hour 30 minutes', NULL, NULL
),
(
    -- Comment 2: On Ticket 1 (Agent Jane, user_id=2 - internal note)
    1, 2, 'Need to check John''s department AD group permissions for M drive. Also, verify if Bob is in the same group.',
    TRUE, NULL, NOW() - INTERVAL '1 hour 15 minutes', NULL, NULL
),
(
    -- Comment 3: On Ticket 2 (Requester: Alice, user_id=5 - urgent ticket)
    2, 5, 'The demo is starting very soon! Is anyone looking at this? It''s critical!',
    FALSE, NULL, NOW() - INTERVAL '20 minutes', NULL, NULL
),
(
    -- Comment 4: On Ticket 2 (Agent Jane, user_id=2 - reply to Alice's comment (Comment ID 3))
    -- Assumes Comment 3 will have comment_id=3 if this is part of a single batch insert.
    2, 2, 'Hi Alice, I''m on it now. Can you confirm if you restarted Outlook? Also, check if you can send email via webmail as a temporary workaround.',
    FALSE, 3, NOW() - INTERVAL '15 minutes', NULL, NULL
),
(
    -- Comment 5: On Ticket 3 (Agent Jane, user_id=2 - public update)
    3, 2, 'Parts ordered for the printer in Building B. Expected arrival in 2 business days. Will update once fixed.',
    FALSE, NULL, NOW() - INTERVAL '22 hours', NULL, NULL
),
(
    -- Comment 6: On Ticket 5 (Resolved ticket, Requester: Alice, user_id=5)
    5, 5, 'Thanks, the password reset worked perfectly!',
    FALSE, NULL, (SELECT resolved_at FROM tickets WHERE ticket_id = 5) + INTERVAL '1 hour', NULL, NULL
);

-- =============================================================================
-- SECTION 5: Seed Knowledge Base Categories
-- =============================================================================
INSERT INTO kb_categories (name, description) VALUES
('Account Issues', 'Help with login, password resets, account settings, and user profiles.'),
('Software Guides', 'How-to guides, configuration steps, and troubleshooting for common software applications.'),
('Hardware Troubleshooting', 'Common hardware problems, peripheral issues, and basic solutions.');

-- =============================================================================
-- SECTION 6: Seed Knowledge Base Articles
-- (Assumes kb_category_ids 1, 2, 3 correspond to 'Account Issues', 'Software Guides', 'Hardware Troubleshooting')
-- =============================================================================
INSERT INTO kb_articles (
    title, content, kb_category_id, author_user_id, status, keywords, view_count, created_at, updated_at
) VALUES
(
    'How to Reset Your Password',
    '## Steps to Reset Your Password\n\n1. Navigate to the login page.\n2. Click on the "Forgot Password?" link.\n3. Enter your registered email address.\n4. Follow the instructions sent to your email to set a new password.\n\nIf you still face issues, please contact support by creating a new ticket.',
    1, 1, 'Published', 'password, reset, forgot password, login, account access', 25,
    NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days'
),
(
    'Outlook Configuration for New Employees',
    '## Configuring Outlook Email\n\nWelcome! Here’s how to set up your company email on Outlook:\n\n1.  **Open Outlook.**\n2.  Go to **File > Add Account**.\n3.  Enter your **email address** (e.g., your.name@company.example.com).\n4.  Click **Connect**.\n5.  Outlook may automatically find your settings. If prompted for a password, enter your network password.\n6.  If manual setup is required, select **Microsoft 365** or **Exchange** type.\n\nContact IT if you encounter any issues.',
    2, 2, 'Published', 'outlook, email, configuration, setup, new employee, mail', 15,
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'
),
(
    'Troubleshooting Printer Error E505',
    '## Investigating Printer Error E505\n\nThis article is a draft for common steps to resolve printer error E505.\n\n* Check for paper jams.\n* Restart the printer.\n* Ensure printer drivers are up to date.\n\n(More details and specific models to be added by support team).',
    3, 2, 'Draft', 'printer, E505, hardware, error, troubleshoot, paper jam', 0,
    NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'
),
(
    'Understanding Your User Profile Settings',
    '## Your User Profile\n\nThis guide explains the different settings available in your user profile within the Help Desk portal.\n\n* **Personal Information:** Update your name and phone number.\n* **Password Changes:** Securely change your login password.\n* **Notification Preferences (Future Feature):** Manage how you receive updates.\n\nTo access your profile, click on your name in the top right corner and select "Profile".',
    NULL, 1, 'Published', 'profile, settings, account, user preferences, details', 10,
    NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'
);
```
