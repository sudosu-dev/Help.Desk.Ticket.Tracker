/**
 * Authentication Controller
 *
 * Handles HTTP requests and responses for authentication-related operations.
 * This controller acts as the intermediary between the Express routes and the
 * authentication service layer, managing request validation, error handling,
 * and response formatting for auth endpoints.
 *
 * Current functionality:
 * - User registration with validation and error handling
 * - Maps client request data to service layer format
 * - Returns standardized JSON responses with appropriate HTTP status codes
 *
 * Future expansions will include login, logout, password reset, and token refresh handlers.
 *
 * @file backend/src/components/auth/auth.controller.ts
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import * as authService from './auth.service';
import { UserRegistrationData } from './auth.service';

export const handleUserRegistration: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract data from request body
    const {
      username,
      email,
      password, // will map to 'password_plaintext'
      first_name,
      last_name,
      phone_number,
    }: {
      username?: string;
      email?: string;
      password?: string;
      first_name?: string;
      last_name?: string;
      phone_number?: string;
    } = req.body;

    // Basic Validation
    if (
      !username ||
      !email ||
      !password ||
      !first_name ||
      !last_name ||
      !phone_number
    ) {
      // Later, throw new ApiError(400, 'All fields (username, email, password, first_name, last_name, phone_number) are required');
      res.status(400).json({
        message:
          'All fields (username, email, password, first_name, last_name, phone_number) are required.',
      });
      return;
    }

    if (password.length < 8) {
      // Later, throw new ApiError(400, 'Password must be at least 8 characters long');
      res
        .status(400)
        .json({ message: 'Password must be at least 8 characters long.' });
      return;
    }

    // Add email format validation, etc...

    const registrationData: UserRegistrationData = {
      username,
      email,
      password_plaintext: password, // Map client's 'password' to 'password_plaintext'
      first_name,
      last_name,
      phone_number,
    };

    // Call the service
    const registeredUser = await authService.registerNewUser(registrationData);

    // Send success responses
    res.status(201).json({
      message: 'User registered successfully!',
      user: {
        user_id: registeredUser.user_id,
        username: registeredUser.username,
        email: registeredUser.email,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('[AuthController - Register] Error:', error.message);
      if (error.message === 'Username or email already exists.') {
        res.status(409).json({ message: error.message }); // 409 conflict
      } else {
        // For other errors thrown by the service or unexpected errors
        res.status(500).json({
          message: 'User registration failed due to an internal error.',
        });
      }
    } else {
      // Fallback for unknown error types
      res.status(500).json({ message: 'An unexpected error occured.' });
    }
  }

  // Will add login controller function here later
};
