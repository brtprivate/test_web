export interface CreateUserDto {
  name: string;
  email: string;
  password?: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  walletAddress?: string;
  privateKey?: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

