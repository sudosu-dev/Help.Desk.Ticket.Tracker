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
