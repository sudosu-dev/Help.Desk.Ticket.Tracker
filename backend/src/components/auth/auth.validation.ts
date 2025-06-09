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
