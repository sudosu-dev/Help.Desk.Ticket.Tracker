// backend/src/core/types/types.ts

// Interface for the user data returned (excluding password)
export interface RegisteredUser {
  userId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  roleId: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  department?: string | null;
  profileImageUrl?: string | null;
}
