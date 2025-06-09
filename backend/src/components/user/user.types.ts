// backend/src/components/user/user.types.ts

// Interface for the data expected for user registration (admin)
export interface AdminCreateUserData {
  username: string;
  email: string;
  password_plaintext: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  roleId: number;
  isActive: boolean;
}

// Interface for getAllUsers user object by admin
export interface UserListView {
  userId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roleName: string;
  isActive: boolean;
  createdAt: Date;
}

// Interface for update of a user by admin
export interface UserUpdateData {
  username?: string;
  email?: string;
  password_plaintext?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  department?: string;
  profileImageUrl?: string;
  roleId?: number;
  isActive?: boolean;
}
