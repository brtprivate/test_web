import Cookies from 'js-cookie';

const ADMIN_TOKEN_KEY = 'aiearn_admin_token';

export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY) || Cookies.get(ADMIN_TOKEN_KEY) || null;
};

export const persistToken = (token: string): void => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  Cookies.set(ADMIN_TOKEN_KEY, token, {
    sameSite: 'lax',
    expires: 7,
  });
};

export const removeToken = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(ADMIN_TOKEN_KEY);
  Cookies.remove(ADMIN_TOKEN_KEY);
};

export const tokenKey = ADMIN_TOKEN_KEY;




