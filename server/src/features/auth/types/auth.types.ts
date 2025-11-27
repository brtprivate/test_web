export interface TelegramAuthDto {
  telegramChatId: number;
  telegramUsername?: string;
  telegramFirstName?: string;
  telegramLastName?: string;
  name?: string;
}

export interface LoginDto {
  telegramChatId: number;
}

export interface SignupDto {
  telegramChatId: number;
  telegramUsername?: string;
  telegramFirstName?: string;
  telegramLastName?: string;
  name: string;
  referralCode?: string; // Optional referral code from referrer
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    telegramChatId: number;
    telegramUsername?: string;
    isActive: boolean;
  };
  token: string;
}

