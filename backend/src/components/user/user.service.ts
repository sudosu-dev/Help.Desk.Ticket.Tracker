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
