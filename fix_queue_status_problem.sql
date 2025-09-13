-- แก้ไขปัญหาการอัพเดทสถานะคิวเป็น 'problem'
-- รันใน Supabase SQL Editor

-- 1. ลบ constraint เก่าที่จำกัด status
ALTER TABLE queue_items DROP CONSTRAINT IF EXISTS queue_items_status_check;

-- 2. เพิ่ม constraint ใหม่ที่รองรับสถานะ 'problem'
ALTER TABLE queue_items 
ADD CONSTRAINT queue_items_status_check 
CHECK (status IN ('waiting', 'processing', 'completed', 'cancelled', 'problem'));

-- 3. ตรวจสอบผลลัพธ์
SELECT 
  constraint_name, 
  check_clause
FROM information_schema.check_constraints 
WHERE constraint_name = 'queue_items_status_check';


