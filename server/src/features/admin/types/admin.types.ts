export interface AdminSignupDto {
  username: string;
  email: string;
  password: string;
}

export interface AdminLoginDto {
  email: string;
  password: string;
}

export interface AdminResponse {
  id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLogin?: Date;
}

export interface AdminAuthResponse {
  admin: AdminResponse;
  token: string;
}

