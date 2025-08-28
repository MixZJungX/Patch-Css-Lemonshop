export interface RedemptionCode {
  id: string;
  code: string;
  robux_value: number;
  status: 'active' | 'used' | 'expired';
  created_at: string;
  used_at?: string;
  used_by?: string;
}

export interface ChickenAccount {
  id: string;
  code: string;
  username: string;
  password: string;
  product_name: string;
  status: 'available' | 'used' | 'maintenance';
  notes?: string;
  created_at: string;
  used_at?: string;
  used_by?: string;
}

export interface RedemptionRequest {
  id: string;
  roblox_username: string;
  robux_amount: number;
  contact_info: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  admin_notes?: string;
  assigned_code?: string;
  assigned_account_code?: string;
  created_at: string;
  updated_at: string;
}

// ระบบคิวใหม่
export interface QueueItem {
  id: string;
  queue_number: number; // หมายเลขคิวแบบสุ่ม
  user_id?: string;
  redemption_request_id?: string;
  customer_name?: string;
  contact_info?: string;
  product_type: 'robux' | 'chicken' | 'rainbow';
  status: 'waiting' | 'processing' | 'completed' | 'cancelled';
  priority?: number; // ลำดับความสำคัญ
  created_at: string;
  updated_at: string;
  estimated_wait_time?: number; // เวลารอโดยประมาณ (นาที)
  admin_notes?: string; // หมายเหตุจากแอดมิน
}

export interface QueueDisplay {
  current_processing?: QueueItem;
  next_3_items: QueueItem[];
  total_waiting: number;
  average_wait_time: number;
}