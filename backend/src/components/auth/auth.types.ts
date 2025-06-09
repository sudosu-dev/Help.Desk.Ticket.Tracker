// backend/src/components/auth/auth.types.ts

// Interface for the data expected for user registration
export interface UserRegistrationData {
  username: string;
  email: string;
  password_plaintext: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

// Interface for the data expected for user login
export interface UserLoginData {
  emailOrUsername: string;
  password_plaintext: string;
}

// Interface for the login response
export interface LoginSuccessResponse {
  token: string;
  user: {
    userId: number;
    username: string;
    email: string;
    roleId: number;
  };
}

// Interface for the data expected for password reset
export interface ResetPasswordData {
  token: string;
  newPassword_plaintext: string;
}
