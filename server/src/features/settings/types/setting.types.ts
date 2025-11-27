export interface CreateSettingDto {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  category: 'general' | 'investment' | 'referral' | 'bonus' | 'wallet';
}

export interface UpdateSettingDto {
  value?: any;
  description?: string;
  isActive?: boolean;
}

export interface SettingResponse {
  id: string;
  key: string;
  value: any;
  type: string;
  description?: string;
  category: string;
  isActive: boolean;
}








