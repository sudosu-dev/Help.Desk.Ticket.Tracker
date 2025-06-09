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
