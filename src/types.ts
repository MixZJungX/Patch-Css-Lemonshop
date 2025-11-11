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
  product_type?: string;
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

// ระบบคิวจาก repository ที่แนะนำ
export interface QueueItem {
  id: string;
  queue_number: number;
  user_id?: string;
  redemption_request_id?: string;
  customer_name?: string;
  contact_info: string;
  product_type: 'robux' | 'chicken' | 'rainbow';
  // รวมสถานะ customer_fixed สำหรับลูกค้าที่แก้ไขปัญหาเอง
  status: 'waiting' | 'processing' | 'completed' | 'cancelled' | 'problem' | 'customer_fixed';
  priority?: number;
  estimated_wait_time?: number;
  admin_notes?: string;
  // ข้อมูลที่ลูกค้าอัปเดตใหม่ (เก็บแยกไม่ไปรบกวนข้อมูลเดิม)
  customer_updated_credentials?: {
    username?: string;
    password?: string;
    old_username?: string;
    game_history_image?: string; // Base64 หรือ URL ของรูปภาพ
    uploaded_at: string;
    note?: string;
  };
  // ข้อมูลเพิ่มเติมจาก redemption requests
  roblox_username?: string;
  roblox_password?: string;
  robux_amount?: number;
  code_id?: string;
  assigned_code?: string;
  assigned_account_code?: string;
  created_at: string;
  updated_at: string;
}

export interface QueueDisplay {
  current_processing?: QueueItem[]; // เปลี่ยนเป็น array เพื่อแสดงคิวทั้งหมดที่กำลังดำเนินการ
  next_3_items: QueueItem[];
  total_waiting: number;
  total_problems: number;
  average_wait_time: number;
}