-- 🔧 แก้ไขเร่งด่วน: เพิ่มคอลัมน์ใน queue_items
-- Copy ทั้งหมดนี้ไปรันใน Supabase SQL Editor

-- 1. เพิ่มคอลัมน์ที่จำเป็น
ALTER TABLE queue_items ADD COLUMN IF NOT EXISTS roblox_username TEXT;
ALTER TABLE queue_items ADD COLUMN IF NOT EXISTS roblox_password TEXT;
ALTER TABLE queue_items ADD COLUMN IF NOT EXISTS robux_amount INTEGER;
ALTER TABLE queue_items ADD COLUMN IF NOT EXISTS code_id UUID;
ALTER TABLE queue_items ADD COLUMN IF NOT EXISTS assigned_code TEXT;
ALTER TABLE queue_items ADD COLUMN IF NOT EXISTS assigned_account_code TEXT;

-- 2. สร้าง index
CREATE INDEX IF NOT EXISTS idx_queue_items_assigned_code ON queue_items(assigned_code);
CREATE INDEX IF NOT EXISTS idx_queue_items_roblox_username ON queue_items(roblox_username);

-- 3. ตรวจสอบผล (ควรเห็น 6 คอลัมน์)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'queue_items' 
  AND column_name IN ('roblox_username', 'roblox_password', 'robux_amount', 'assigned_code', 'code_id', 'assigned_account_code')
ORDER BY column_name;

-- ✅ ถ้าเห็น 6 แถว = สำเร็จ!

