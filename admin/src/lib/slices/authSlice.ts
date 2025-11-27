import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { persistToken, removeToken, getStoredToken } from '@/lib/utils/token';

export type AdminRole = 'admin' | 'super_admin';

export interface AdminProfile {
  id: string;
  username: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  lastLogin?: string;
  createdAt?: string;
}

interface AuthState {
  token: string | null;
  admin: AdminProfile | null;
  status: 'idle' | 'loading' | 'authenticated' | 'error';
  error?: string | null;
}

const initialState: AuthState = {
  token: null,
  admin: null,
  status: 'idle',
  error: null,
};

const authSlice = createSlice({
  name: 'adminAuth',
  initialState,
  reducers: {
    hydrateFromStorage(state) {
      if (typeof window === 'undefined') return;
      const token = getStoredToken();
      if (token) {
        state.token = token;
      }
    },
    setCredentials(state, action: PayloadAction<{ token: string; admin: AdminProfile }>) {
      state.token = action.payload.token;
      state.admin = action.payload.admin;
      state.status = 'authenticated';
      state.error = null;
      persistToken(action.payload.token);
    },
    clearSession(state) {
      state.token = null;
      state.admin = null;
      state.status = 'idle';
      state.error = null;
      removeToken();
    },
    setAuthStatus(state, action: PayloadAction<AuthState['status']>) {
      state.status = action.payload;
    },
    setAuthError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      if (action.payload) {
        state.status = 'error';
      }
    },
    updateProfile(state, action: PayloadAction<Partial<AdminProfile>>) {
      if (!state.admin) {
        state.admin = action.payload as AdminProfile;
        return;
      }
      state.admin = { ...state.admin, ...action.payload };
    },
  },
});

export const {
  hydrateFromStorage,
  setCredentials,
  clearSession,
  setAuthStatus,
  setAuthError,
  updateProfile,
} = authSlice.actions;

export default authSlice.reducer;


