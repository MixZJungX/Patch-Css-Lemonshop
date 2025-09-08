export interface RedeemCode {
  id: string;
  code: string;
  value: number;
  is_used: boolean;
  created_at: string;
}

export interface RedemptionRequest {
  id: string;
  code: string;
  roblox_username: string;
  contact_info: string;
  phone?: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  role?: string;
}