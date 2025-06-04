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