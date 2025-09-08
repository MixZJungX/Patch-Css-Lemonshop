-- แก้ไขตาราง redemption_requests
-- รันใน Supabase SQL Editor

-- 1. ตรวจสอบว่าตารางมีอยู่หรือไม่
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'app_284beb8f90_redemption_requests'
) as table_exists;

-- 2. หากไม่มีตาราง ให้สร้างใหม่
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

-- 3. สร้าง index
CREATE INDEX IF NOT EXISTS idx_redemption_requests_status ON app_284beb8f90_redemption_requests(status);
CREATE INDEX IF NOT EXISTS idx_redemption_requests_created_at ON app_284beb8f90_redemption_requests(created_at);

-- 4. ตรวจสอบ RLS policies
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

-- 5. สร้าง policies ใหม่
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

-- 6. ตรวจสอบโครงสร้างตาราง
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'app_284beb8f90_redemption_requests'
ORDER BY ordinal_position;

-- 7. ตรวจสอบข้อมูลในตาราง
SELECT COUNT(*) as total_requests FROM app_284beb8f90_redemption_requests;

-- 8. ดูข้อมูลล่าสุด
SELECT 
  id,
  roblox_username,
  roblox_password,
  robux_amount,
  contact_info,
  phone,
  status,
  assigned_code,
  code_id,
  created_at
FROM app_284beb8f90_redemption_requests 
ORDER BY created_at DESC 
LIMIT 3;
