-- ตรวจสอบและแก้ไข database schema ของ redemption_requests
-- รันใน Supabase SQL Editor

-- 1. ตรวจสอบโครงสร้างตารางปัจจุบัน
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'app_284beb8f90_redemption_requests'
ORDER BY ordinal_position;

-- 2. ตรวจสอบว่าตารางมีอยู่หรือไม่
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'app_284beb8f90_redemption_requests'
) as table_exists;

-- 3. หากไม่มีตาราง ให้สร้างใหม่
CREATE TABLE IF NOT EXISTS app_284beb8f90_redemption_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  roblox_username TEXT NOT NULL,
  roblox_password TEXT,
  robux_amount INTEGER NOT NULL,
  contact_info TEXT NOT NULL,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  assigned_code TEXT,
  assigned_account_code TEXT,
  code_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. เพิ่ม columns ที่อาจจะขาดหายไป
DO $$ 
BEGIN
  -- เพิ่ม roblox_password column ถ้ายังไม่มี
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_284beb8f90_redemption_requests' AND column_name = 'roblox_password') THEN
    ALTER TABLE app_284beb8f90_redemption_requests ADD COLUMN roblox_password TEXT;
  END IF;
  
  -- เพิ่ม phone column ถ้ายังไม่มี
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_284beb8f90_redemption_requests' AND column_name = 'phone') THEN
    ALTER TABLE app_284beb8f90_redemption_requests ADD COLUMN phone TEXT;
  END IF;
  
  -- เพิ่ม code_id column ถ้ายังไม่มี
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_284beb8f90_redemption_requests' AND column_name = 'code_id') THEN
    ALTER TABLE app_284beb8f90_redemption_requests ADD COLUMN code_id UUID;
  END IF;
  
  -- เพิ่ม assigned_code column ถ้ายังไม่มี
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_284beb8f90_redemption_requests' AND column_name = 'assigned_code') THEN
    ALTER TABLE app_284beb8f90_redemption_requests ADD COLUMN assigned_code TEXT;
  END IF;
END $$;

-- 5. สร้าง index
CREATE INDEX IF NOT EXISTS idx_redemption_requests_status ON app_284beb8f90_redemption_requests(status);
CREATE INDEX IF NOT EXISTS idx_redemption_requests_created_at ON app_284beb8f90_redemption_requests(created_at);

-- 6. ตรวจสอบ RLS policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'app_284beb8f90_redemption_requests';

-- 7. สร้าง policies ใหม่
DROP POLICY IF EXISTS "Enable read access for all users" ON app_284beb8f90_redemption_requests;
CREATE POLICY "Enable read access for all users" ON app_284beb8f90_redemption_requests
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert access for all users" ON app_284beb8f90_redemption_requests;
CREATE POLICY "Enable insert access for all users" ON app_284beb8f90_redemption_requests
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for all users" ON app_284beb8f90_redemption_requests;
CREATE POLICY "Enable update access for all users" ON app_284beb8f90_redemption_requests
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete access for all users" ON app_284beb8f90_redemption_requests;
CREATE POLICY "Enable delete access for all users" ON app_284beb8f90_redemption_requests
  FOR DELETE USING (true);

-- 8. เปิดใช้งาน RLS
ALTER TABLE app_284beb8f90_redemption_requests ENABLE ROW LEVEL SECURITY;

-- 9. ตรวจสอบข้อมูลปัจจุบัน
SELECT COUNT(*) as total_requests FROM app_284beb8f90_redemption_requests;

-- 10. แสดงตัวอย่างข้อมูลล่าสุด
SELECT 
  id,
  roblox_username,
  robux_amount,
  assigned_code,
  status,
  created_at
FROM app_284beb8f90_redemption_requests
ORDER BY created_at DESC
LIMIT 5;
