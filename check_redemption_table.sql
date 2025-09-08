-- ตรวจสอบและแก้ไขตาราง redemption_requests
-- รันใน Supabase SQL Editor

-- 1. ตรวจสอบว่าตาราง redemption_requests มีอยู่หรือไม่
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'app_284beb8f90_redemption_requests'
) as table_exists;

-- 2. ตรวจสอบโครงสร้างตาราง
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'app_284beb8f90_redemption_requests'
ORDER BY ordinal_position;

-- 3. เพิ่มคอลัมน์ที่ขาดหายไป (ถ้ามี)
ALTER TABLE app_284beb8f90_redemption_requests 
ADD COLUMN IF NOT EXISTS roblox_password TEXT;

ALTER TABLE app_284beb8f90_redemption_requests 
ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE app_284beb8f90_redemption_requests 
ADD COLUMN IF NOT EXISTS code_id UUID;

-- 4. ตรวจสอบข้อมูลในตาราง
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
LIMIT 5;

-- 5. นับจำนวนข้อมูลทั้งหมด
SELECT COUNT(*) as total_requests FROM app_284beb8f90_redemption_requests;

-- 6. นับจำนวนข้อมูลที่ขาดหายไป
SELECT 
  COUNT(*) as total_requests,
  COUNT(roblox_password) as has_password,
  COUNT(phone) as has_phone,
  COUNT(code_id) as has_code_id,
  COUNT(assigned_code) as has_assigned_code
FROM app_284beb8f90_redemption_requests;
