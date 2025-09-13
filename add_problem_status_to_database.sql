-- เพิ่มสถานะ 'problem' ในระบบคิว
-- รันใน Supabase SQL Editor

-- 1. ตรวจสอบโครงสร้างตาราง queue_items ปัจจุบัน
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'queue_items' 
ORDER BY ordinal_position;

-- 2. ตรวจสอบ constraint ของคอลัมน์ status
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name, 
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'queue_items' 
  AND tc.constraint_type = 'CHECK'
  AND kcu.column_name = 'status';

-- 3. ลบ constraint เก่า (ถ้ามี)
DO $$
BEGIN
  -- ลบ constraint เก่าที่จำกัด status
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'queue_items' 
    AND constraint_type = 'CHECK'
    AND constraint_name LIKE '%status%'
  ) THEN
    ALTER TABLE queue_items DROP CONSTRAINT IF EXISTS queue_items_status_check;
  END IF;
END $$;

-- 4. เพิ่ม constraint ใหม่ที่รองรับสถานะ 'problem'
ALTER TABLE queue_items 
ADD CONSTRAINT queue_items_status_check 
CHECK (status IN ('waiting', 'processing', 'completed', 'cancelled', 'problem'));

-- 5. ตรวจสอบตาราง redemption_requests ด้วย (ถ้ามี)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'app_284beb8f90_redemption_requests'
  ) THEN
    -- ลบ constraint เก่าใน redemption_requests
    ALTER TABLE app_284beb8f90_redemption_requests 
    DROP CONSTRAINT IF EXISTS app_284beb8f90_redemption_requests_status_check;
    
    -- เพิ่ม constraint ใหม่ (ถ้าต้องการ)
    -- ALTER TABLE app_284beb8f90_redemption_requests 
    -- ADD CONSTRAINT app_284beb8f90_redemption_requests_status_check 
    -- CHECK (status IN ('pending', 'processing', 'completed', 'rejected'));
  END IF;
END $$;

-- 6. ตรวจสอบผลลัพธ์
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name, 
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'queue_items' 
  AND tc.constraint_type = 'CHECK'
  AND kcu.column_name = 'status';

-- 7. ทดสอบเพิ่มข้อมูลสถานะ 'problem' (ถ้าต้องการ)
-- UPDATE queue_items 
-- SET status = 'problem' 
-- WHERE id = 'your-queue-id-here';

-- 8. ตรวจสอบข้อมูลในตาราง
SELECT 
  id,
  queue_number,
  status,
  created_at
FROM queue_items 
ORDER BY created_at DESC 
LIMIT 10;


