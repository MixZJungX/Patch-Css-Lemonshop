-- ตรวจสอบ constraints และ required fields ของ queue_items
-- รันใน Supabase SQL Editor

-- 1. ดูโครงสร้างตารางทั้งหมด
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'queue_items' 
ORDER BY ordinal_position;

-- 2. ดู constraints (NOT NULL, UNIQUE, etc.)
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'queue_items'
ORDER BY tc.constraint_type, kcu.column_name;

-- 3. ลองบันทึกข้อมูลทดสอบ (ดูว่า error อะไร)
INSERT INTO queue_items (
  contact_info,
  product_type,
  status,
  roblox_username,
  roblox_password,
  robux_amount,
  assigned_code
) VALUES (
  'Test contact',
  'robux',
  'waiting',
  'TestUser',
  'TestPass123',
  80,
  'TEST001'
);

-- ถ้า insert สำเร็จ ให้ลบทิ้ง
DELETE FROM queue_items WHERE roblox_username = 'TestUser';

