import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getToken as getCookieToken, setToken as setCookieToken, removeToken as removeCookieToken } from '@/lib/utils/cookies';

export interface AuthState {
  token: string | null;
  lastSyncedAt: number | null;
}

const readTokenFromStorage = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = window.localStorage.getItem('token');
    if (stored) {
      return stored;
    }
  } catch (error) {
    console.warn('Unable to read token from localStorage:', error);
  }

  return getCookieToken();
};

const persistToken = (token: string | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (token) {
      window.localStorage.setItem('token', token);
      setCookieToken(token, 7);
    } else {
      window.localStorage.removeItem('token');
      removeCookieToken();
    }
  } catch (error) {
    console.warn('Unable to persist token in storage:', error);
  }
};

const initialState: AuthState = {
  token: typeof window === 'undefined' ? null : readTokenFromStorage(),
  lastSyncedAt: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;
      state.lastSyncedAt = Date.now();
      persistToken(action.payload);
    },
    clearAuthToken: (state) => {
      state.token = null;
      state.lastSyncedAt = Date.now();
      persistToken(null);
    },
    syncAuthToken: (state) => {
      const token = readTokenFromStorage();
      state.token = token;
      state.lastSyncedAt = Date.now();
    },
  },
});

export const { setAuthToken, clearAuthToken, syncAuthToken } = authSlice.actions;
export default authSlice.reducer;


