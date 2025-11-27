export interface Setting {
  _id: string;
  key: string;
  value: string | number | boolean;
  description?: string;
  category?: string;
  updatedAt?: string;
}

export interface SettingsResponse {
  status: string;
  results: number;
  data: {
    settings: Setting[];
  };
}




