-- ตรวจสอบข้อมูลในตาราง redemption_requests
-- รันใน Supabase SQL Editor

-- 1. ดูข้อมูลล่าสุด 10 รายการ
SELECT 
  id,
  roblox_username,
  robux_amount,
  contact_info,
  status,
  assigned_code,
  created_at
FROM app_284beb8f90_redemption_requests 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. นับจำนวนข้อมูลตามสถานะ
SELECT 
  status,
  COUNT(*) as count
FROM app_284beb8f90_redemption_requests 
GROUP BY status
ORDER BY count DESC;

-- 3. ตรวจสอบข้อมูลที่ขาดหายไป
SELECT 
  COUNT(*) as total_requests,
  COUNT(roblox_username) as has_username,
  COUNT(robux_amount) as has_robux_amount,
  COUNT(contact_info) as has_contact_info,
  COUNT(assigned_code) as has_assigned_code
FROM app_284beb8f90_redemption_requests;

-- 4. ดูรายการที่ไม่มี assigned_code
SELECT 
  id,
  roblox_username,
  robux_amount,
  contact_info,
  status,
  assigned_code,
  created_at
FROM app_284beb8f90_redemption_requests 
WHERE assigned_code IS NULL OR assigned_code = ''
ORDER BY created_at DESC 
LIMIT 5;
