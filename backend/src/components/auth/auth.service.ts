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
