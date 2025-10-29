-- 🔧 แก้ไขปัญหาการแสดงโค้ดเก่าเมื่อลูกค้าสั่งซ้ำ
-- ปัญหา: คิว 590 และ 785 เป็นลูกค้าคนเดียวกัน แต่แสดงโค้ดเก่าแทนโค้ดใหม่ 50ROGA310A

-- STEP 1: ตรวจสอบข้อมูลคิว 590 และ 785
SELECT 
  queue_number,
  id,
  customer_name,
  contact_info,
  assigned_code,
  roblox_username,
  status,
  created_at
FROM queue_items
WHERE queue_number IN (590, 785)
ORDER BY queue_number;

-- STEP 2: อัพเดตโค้ดที่ถูกต้องจาก contact_info ไปยัง assigned_code
-- (กรณีที่โค้ดใน contact_info ถูกต้องแต่ assigned_code ไม่ถูกต้อง)

-- สำหรับคิว 590
UPDATE queue_items
SET assigned_code = regexp_replace(contact_info, '.*Code:\s*([^|]+).*', '\1')
WHERE queue_number = 590
  AND contact_info LIKE '%Code:%'
  AND regexp_replace(contact_info, '.*Code:\s*([^|]+).*', '\1') != assigned_code;

-- สำหรับคิว 785
UPDATE queue_items
SET assigned_code = regexp_replace(contact_info, '.*Code:\s*([^|]+).*', '\1')
WHERE queue_number = 785
  AND contact_info LIKE '%Code:%'
  AND regexp_replace(contact_info, '.*Code:\s*([^|]+).*', '\1') != assigned_code;

-- STEP 3: อัพเดตโค้ดจาก contact_info สำหรับทุกคิวที่มีปัญหาคล้ายกัน
-- (กรณีที่ contact_info มีโค้ดแต่ assigned_code ไม่ตรงกัน)
UPDATE queue_items
SET 
  assigned_code = regexp_replace(contact_info, '.*Code:\s*([^|]+).*', '\1'),
  updated_at = NOW()
WHERE contact_info LIKE '%Code:%'
  AND (
    assigned_code IS NULL 
    OR assigned_code = '' 
    OR assigned_code != regexp_replace(contact_info, '.*Code:\s*([^|]+).*', '\1')
  );

-- STEP 4: ตรวจสอบผลลัพธ์หลังอัพเดต
SELECT 
  queue_number,
  customer_name,
  regexp_replace(contact_info, '.*Code:\s*([^|]+).*', '\1') as code_from_contact_info,
  assigned_code,
  CASE 
    WHEN regexp_replace(contact_info, '.*Code:\s*([^|]+).*', '\1') = assigned_code THEN '✅ ถูกต้อง'
    ELSE '❌ ไม่ตรงกัน'
  END as status,
  created_at
FROM queue_items
WHERE queue_number IN (590, 785)
ORDER BY queue_number;

-- STEP 5: ตรวจสอบคิวทั้งหมดที่อาจมีปัญหาคล้ายกัน
-- (ลูกค้าคนเดียวกันมีหลายคิว)
SELECT 
  customer_name,
  COUNT(*) as total_queues,
  STRING_AGG(queue_number::text, ', ' ORDER BY queue_number) as queue_numbers,
  STRING_AGG(DISTINCT regexp_replace(contact_info, '.*Code:\s*([^|]+).*', '\1'), ', ') as codes
FROM queue_items
WHERE contact_info LIKE '%Code:%'
GROUP BY customer_name
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- STEP 6: แสดงรายละเอียดของลูกค้าที่มีหลายคิว
SELECT 
  customer_name,
  queue_number,
  regexp_replace(contact_info, '.*Code:\s*([^|]+).*', '\1') as code_from_contact,
  assigned_code,
  status,
  created_at
FROM queue_items
WHERE customer_name IN (
  SELECT customer_name
  FROM queue_items
  WHERE contact_info LIKE '%Code:%'
  GROUP BY customer_name
  HAVING COUNT(*) > 1
)
ORDER BY customer_name, queue_number;

-- 📝 หมายเหตุ:
-- 1. ระบบถูกปรับปรุงให้ดึงโค้ดจาก contact_info เป็นหลักแล้ว
-- 2. SQL นี้จะอัพเดต assigned_code ให้ตรงกับโค้ดใน contact_info
-- 3. หลังจากรันแล้ว ควรตรวจสอบ STEP 4 ว่าโค้ดถูกต้องแล้ว






