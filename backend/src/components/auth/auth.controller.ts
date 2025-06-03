import { Request, Response, NextFunction, RequestHandler } from 'express';
import * as authService from './auth.service';
import {
  UserRegistrationData,
  UserLoginData,
  LoginSuccessResponse,
  RegisteredUser,
} from './auth.service';
import { nextTick } from 'process';

// --- USER REGISTRATION ----

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
      res.status(500).json({ message: 'An unexpected error occurred.' });
    }
    return;
  }
};

// ---- LOGIN ----

export const handleUserLogin: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract data from request body
    const {
      emailOrUsername,
      password,
    }: { emailOrUsername?: string; password?: string } = req.body;

    // Basic Validation
    if (!emailOrUsername || !password) {
      res
        .status(400)
        .json({ message: 'Email/username and password are required.' });
      return;
    }

    const loginData: UserLoginData = {
      emailOrUsername,
      password_plaintext: password,
    };

    // Call login service
    const loginResult: LoginSuccessResponse =
      await authService.loginUser(loginData);

    // Send success respons
    res.status(200).json({
      message: 'Login successful!',
      token: loginResult.token,
      user: loginResult.user, // Contains user_id, username, email, role_id
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
      } else if (error.message === 'Authentication configuration error.') {
        res.status(500).json({
          message:
            'Server authentication configuration error. Please try again later.',
        });
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
    return;
  }
};

// --- PASSWORD RESET ----

/**
 * Handles a request to initiate a password reset.
 * Takes an email from the request body, calls the service to generate
 * and store a reset token (if the user exists and is active).
 * Always returns a generic success-like message to prevent email enumeration.
 */
export const handleRequestPasswordReset: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email }: { email?: string } = req.body;

    if (!email) {
      res.status(500).json({ message: 'Email is required.' });
      return;
    }

    // Call the service to generate and store a reset token
    const plaintextToken = await authService.requestPasswordReset(email);

    // V1 simulate the email sending. V2 trigger an email
    if (plaintextToken) {
      console.log(
        `[AuthController - RequestReset] Password reset token generated for ${email}: ${plaintextToken}`
      );
    } else {
      console.log(
        `[AuthController - RequestReset] Password reset requested for non-existent or inactive email: ${email}`
      );
    }

    // Send a generic success message to the client
    res
      .status(200)
      .json({
        message:
          'If an account with that email exists, a password reset link has been sent.',
      });
  } catch (error) {
    console.error('[AuthController - RequestReset] Error:', error);
    if (error instanceof Error) {
      res
        .status(500)
        .json({
          message:
            error.message ||
            'Failed to process password reset request due to an internal server error.',
        });
    } else {
      res
        .status(500)
        .json({
          message:
            'An unexpected error occurred while processing the password reset request.',
        });
    }
    return;
  }
};

// ---- LOGOUT ----

export const handleuserLogout: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Call the service function
    const result = await authService.logoutUser();

    res.status(200).json({ message: result.message || 'Logout successful.' });
  } catch (error) {
    console.error('[AuthController - Logout] Error:', error);
    if (error instanceof Error) {
      res.status(500).json({
        message:
          error.message || 'Logout failed due to an internal server error.',
      });
    } else {
      res
        .status(500)
        .json({ message: 'An unexpected error occurred during logout.' });
    }
    return;
  }
};
