/**
 * Referral Code Utility Functions
 * Handles referral code storage and retrieval from localStorage
 */

const REFERRAL_CODE_KEY = 'referral_code';
const DEFAULT_REFERRAL_CODE = 'SYSTEM'; // Default referral code if none provided

/**
 * Get referral code from localStorage
 */
export const getReferralCode = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFERRAL_CODE_KEY);
};

/**
 * Set referral code in localStorage
 */
export const setReferralCode = (code: string): void => {
  if (typeof window === 'undefined') return;
  if (code && code.trim()) {
    localStorage.setItem(REFERRAL_CODE_KEY, code.trim().toUpperCase());
  }
};

/**
 * Remove referral code from localStorage
 */
export const removeReferralCode = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(REFERRAL_CODE_KEY);
};

/**
 * Get referral code or return default
 */
export const getReferralCodeOrDefault = (): string => {
  const code = getReferralCode();
  return code || DEFAULT_REFERRAL_CODE;
};





