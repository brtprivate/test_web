/**
 * Cookie Utility Functions
 * Handles token storage in cookies for authentication
 */

/**
 * Set a cookie
 */
export const setCookie = (name: string, value: string, days: number = 7): void => {
  if (typeof window === 'undefined') return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  
  // Only use Secure flag for HTTPS, not for localhost
  const isSecure = window.location.protocol === 'https:' && !window.location.hostname.includes('localhost');
  const secureFlag = isSecure ? ';Secure' : '';
  
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax${secureFlag}`;
};

/**
 * Get a cookie value
 */
export const getCookie = (name: string): string | null => {
  if (typeof window === 'undefined') return null;
  
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      return c.substring(nameEQ.length, c.length);
    }
  }
  
  return null;
};

/**
 * Remove a cookie
 */
export const removeCookie = (name: string): void => {
  if (typeof window === 'undefined') return;
  
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

/**
 * Get authentication token from cookies
 */
export const getToken = (): string | null => {
  return getCookie('token');
};

/**
 * Set authentication token in cookies
 */
export const setToken = (token: string, days: number = 7): void => {
  setCookie('token', token, days);
};

/**
 * Remove authentication token from cookies
 */
export const removeToken = (): void => {
  removeCookie('token');
};



