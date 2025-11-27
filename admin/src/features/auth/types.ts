export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  status: 'success' | 'error';
  message?: string;
  data?: AdminLoginData;
}

export interface AdminLoginData {
  token: string;
  admin: {
    id: string;
    username: string;
    email: string;
    role: 'admin' | 'super_admin';
    isActive: boolean;
    lastLogin?: string;
  };
}

export interface AdminProfileResponse {
  status: 'success';
  data: {
    admin: {
      id: string;
      username: string;
      email: string;
      role: 'admin' | 'super_admin';
      isActive: boolean;
      lastLogin?: string;
      createdAt?: string;
    };
  };
}


