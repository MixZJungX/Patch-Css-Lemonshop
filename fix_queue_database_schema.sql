-- แก้ไขโครงสร้างตาราง queue_items ให้รองรับข้อมูลเพิ่มเติม
-- รันใน Supabase SQL Editor

-- 1. ตรวจสอบโครงสร้างตารางปัจจุบัน
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'queue_items' 
ORDER BY ordinal_position;

-- 2. เพิ่มคอลัมน์ใหม่ในตาราง queue_items (ถ้ายังไม่มี)
ALTER TABLE queue_items ADD COLUMN IF NOT EXISTS roblox_username TEXT;
ALTER TABLE queue_items ADD COLUMN IF NOT EXISTS roblox_password TEXT;
ALTER TABLE queue_items ADD COLUMN IF NOT EXISTS robux_amount INTEGER;
ALTER TABLE queue_items ADD COLUMN IF NOT EXISTS code_id UUID;
ALTER TABLE queue_items ADD COLUMN IF NOT EXISTS assigned_code TEXT;
ALTER TABLE queue_items ADD COLUMN IF NOT EXISTS assigned_account_code TEXT;

-- 3. ตรวจสอบว่ามีตาราง redemption_requests หรือไม่
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'app_284beb8f90_redemption_requests'
) as redemption_table_exists;

-- 4. ถ้ามีตาราง redemption_requests ให้ย้ายข้อมูล
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'app_284beb8f90_redemption_requests'
    ) THEN
        -- อัปเดตข้อมูลใน queue_items จาก redemption_requests
        UPDATE queue_items 
        SET 
          roblox_username = r.roblox_username,
          roblox_password = r.roblox_password,
          robux_amount = r.robux_amount,
          code_id = r.code_id,
          assigned_code = r.assigned_code,
          assigned_account_code = r.assigned_account_code
        FROM app_284beb8f90_redemption_requests r
        WHERE queue_items.contact_info LIKE '%' || r.roblox_username || '%'
        OR queue_items.contact_info LIKE '%' || r.contact_info || '%';
        
        RAISE NOTICE 'อัปเดตข้อมูลใน queue_items จาก redemption_requests สำเร็จ';
    ELSE
        RAISE NOTICE 'ไม่พบตาราง redemption_requests';
    END IF;
END $$;

-- 5. ตรวจสอบโครงสร้างตารางหลังอัปเดต
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'queue_items' 
ORDER BY ordinal_position;

-- 6. ตรวจสอบข้อมูลตัวอย่าง
SELECT 
  queue_number,
  roblox_username,
  robux_amount,
  assigned_code,
  assigned_account_code,
  contact_info
FROM queue_items 
WHERE roblox_username IS NOT NULL 
OR robux_amount IS NOT NULL 
OR assigned_code IS NOT NULL
LIMIT 5;

