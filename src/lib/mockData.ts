import { RedemptionCode, ChickenAccount } from '@/types';

// Mock data for when Supabase is unavailable
export const mockCodes: RedemptionCode[] = [
  {
    id: '1',
    code: 'ROBUX100',
    robux_value: 100,
    status: 'active',
    created_at: new Date().toISOString(),
    created_by: 'system',
    used_by: null,
    used_at: null
  },
  {
    id: '2',
    code: 'ROBUX200',
    robux_value: 200,
    status: 'active',
    created_at: new Date().toISOString(),
    created_by: 'system',
    used_by: null,
    used_at: null
  },
  {
    id: '3',
    code: 'ROBUX400',
    robux_value: 400,
    status: 'active',
    created_at: new Date().toISOString(),
    created_by: 'system',
    used_by: null,
    used_at: null
  }
];

export const mockAccounts: ChickenAccount[] = [
  {
    id: '1',
    code: 'CHICKEN1',
    product_name: 'Disco Bee',
    username: 'demo_username1',
    password: 'demo_password1',
    notes: 'สำหรับทดสอบเท่านั้น',
    status: 'available',
    created_at: new Date().toISOString(),
    created_by: 'system',
    used_at: null
  },
  {
    id: '2',
    code: 'CHICKEN2',
    product_name: 'Disco Bee',
    username: 'demo_username2',
    password: 'demo_password2',
    notes: 'สำหรับทดสอบเท่านั้น',
    status: 'available',
    created_at: new Date().toISOString(),
    created_by: 'system',
    used_at: null
  },
  {
    id: '3',
    code: 'CHICKEN3',
    product_name: 'Master Bear',
    username: 'demo_username3',
    password: 'demo_password3',
    notes: 'สำหรับทดสอบเท่านั้น',
    status: 'available',
    created_at: new Date().toISOString(),
    created_by: 'system',
    used_at: null
  }
];