-- แก้ไข assigned_code จาก contact_info
-- รันใน Supabase SQL Editor

-- 1. อัปเดต assigned_code จาก contact_info สำหรับรายการที่ไม่มี assigned_code
UPDATE app_284beb8f90_redemption_requests 
SET assigned_code = 
  CASE 
    WHEN contact_info LIKE 'Code: %' 
    THEN SUBSTRING(contact_info FROM 'Code: ([^|]+)')
    ELSE NULL 
  END
WHERE (assigned_code IS NULL OR assigned_code = '')
AND contact_info LIKE 'Code: %';

-- 2. ตรวจสอบผลลัพธ์
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
LIMIT 5;

-- 3. นับจำนวนที่อัปเดตแล้ว
SELECT 
  COUNT(*) as total_requests,
  COUNT(assigned_code) as has_assigned_code,
  COUNT(*) - COUNT(assigned_code) as missing_assigned_code
FROM app_284beb8f90_redemption_requests;
