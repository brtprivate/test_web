export type SettingType = 'string' | 'number' | 'boolean' | 'object' | 'array';

export interface Setting {
  _id: string;
  key: string;
  value: string | number | boolean | Record<string, unknown> | Array<unknown>;
  type: SettingType;
  description?: string;
  category?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SettingsResponse {
  status: string;
  results: number;
  data: {
    settings: Setting[];
  };
}