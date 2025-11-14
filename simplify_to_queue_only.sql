-- ปรับระบบให้ใช้ queue_items เพียงอย่างเดียว
-- ไม่ต้อง match กับ redemption_requests อีกต่อไป
-- รันใน Supabase SQL Editor

-- 1. ตรวจสอบว่ามีคอลัมน์ที่จำเป็นหรือยัง
SELECT 
  table_name,
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'queue_items' 
  AND column_name IN ('roblox_username', 'roblox_password', 'robux_amount', 'assigned_code', 'code_id', 'assigned_account_code')
ORDER BY column_name;

-- 2. เพิ่มคอลัมน์ใหม่ในตาราง queue_items (ถ้ายังไม่มี)
ALTER TABLE queue_items ADD COLUMN IF NOT EXISTS roblox_username TEXT;
ALTER TABLE queue_items ADD COLUMN IF NOT EXISTS roblox_password TEXT;
ALTER TABLE queue_items ADD COLUMN IF NOT EXISTS robux_amount INTEGER;
ALTER TABLE queue_items ADD COLUMN IF NOT EXISTS code_id UUID;
ALTER TABLE queue_items ADD COLUMN IF NOT EXISTS assigned_code TEXT;
ALTER TABLE queue_items ADD COLUMN IF NOT EXISTS assigned_account_code TEXT;

-- 3. สร้าง index เพื่อเร่งการค้นหา
CREATE INDEX IF NOT EXISTS idx_queue_items_assigned_code ON queue_items(assigned_code);
CREATE INDEX IF NOT EXISTS idx_queue_items_roblox_username ON queue_items(roblox_username);
CREATE INDEX IF NOT EXISTS idx_queue_items_product_type_status ON queue_items(product_type, status);

-- 4. ลบคอลัมน์ที่ไม่ใช้แล้ว (optional)
-- ALTER TABLE queue_items DROP COLUMN IF EXISTS redemption_request_id;
-- ALTER TABLE queue_items DROP COLUMN IF EXISTS customer_name;

-- 5. ตรวจสอบโครงสร้างตารางหลังอัพเดท
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'queue_items' 
ORDER BY ordinal_position;

-- ✅ เสร็จสิ้น! ตอนนี้ queue_items สามารถเก็บข้อมูลครบถ้วนแล้ว
-- ไม่ต้องพึ่งพา redemption_requests อีกต่อไป

