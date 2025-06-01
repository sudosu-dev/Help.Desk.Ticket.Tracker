// backend/src/components/auth/auth.service.ts
import pool from '../../core/db';
import bcrypt from 'bcrypt';

// Interface for the data expected for user registration
export interface UserRegistrationData {
  username: string;
  email: string;
  password_plaintext: string;
  first_name: string;
  last_name: string;
  phone_number: string;
}

// Interface for the user data returned (excluding password)
export interface RegisteredUser {
  user_id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  role_id: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export const registerNewUser = async (
  userData: UserRegistrationData
): Promise<RegisteredUser> => {
  const {
    username,
    email,
    password_plaintext,
    first_name,
    last_name,
    phone_number,
  } = userData;

  // 1. Check if user already exists (by username or email)
  const existingUserResult = await pool.query(
    'SELECT user_id FROM users WHERE username = $1 OR email = $2',
    [username, email]
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
        RETURNING user_id, username, email, first_name, last_name, phone_number, role_id, is_active, created_at, updated_at;
    `;
  const values = [
    username,
    email,
    password_hash,
    first_name,
    last_name,
    phone_number,
  ];

  try {
    const newUserResult = await pool.query(insertQuery, values);
    if (newUserResult.rows.length === 0) {
      // This should not happen if the insert was successful and returning was used
      throw new Error('User registration failed, user not created.');
    }
    return newUserResult.rows[0] as RegisteredUser;
  } catch (error) {
    console.error('Error during registration:', error);
    throw new Error('Could not register user due to a database error.');
  }
};
