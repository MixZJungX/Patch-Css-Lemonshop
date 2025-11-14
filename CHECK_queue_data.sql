-- ตรวจสอบว่าข้อมูลบันทึกเข้า queue_items แล้วหรือยัง
-- รันใน Supabase SQL Editor

-- 1. ดูข้อมูลคิวล่าสุด 10 รายการ
SELECT 
  queue_number,
  roblox_username,
  roblox_password,
  assigned_code,
  robux_amount,
  status,
  product_type,
  created_at
FROM queue_items
ORDER BY created_at DESC
LIMIT 10;

-- 2. นับจำนวนคิวแต่ละสถานะ
SELECT 
  status,
  COUNT(*) as total
FROM queue_items
GROUP BY status
ORDER BY total DESC;

-- 3. ดูคิว Robux ที่มี assigned_code (แลกโค้ดแล้ว)
SELECT 
  queue_number,
  roblox_username,
  assigned_code,
  robux_amount,
  status,
  created_at
FROM queue_items
WHERE product_type = 'robux' 
  AND assigned_code IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

