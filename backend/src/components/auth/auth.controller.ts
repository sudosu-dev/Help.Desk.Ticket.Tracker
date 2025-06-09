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
