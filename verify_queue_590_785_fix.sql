-- ✅ ตรวจสอบการแก้ไขสำหรับคิว 590 และ 785
-- โค้ดที่ถูกต้องคือ: 50ROGA310A

-- 1. ตรวจสอบข้อมูลปัจจุบันของคิว 590 และ 785
SELECT 
  '🔍 ข้อมูลปัจจุบัน' as section,
  queue_number,
  customer_name,
  contact_info,
  assigned_code,
  status,
  TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_time
FROM queue_items
WHERE queue_number IN (590, 785)
ORDER BY queue_number;

-- 2. แยกโค้ดจาก contact_info และเปรียบเทียบ
SELECT 
  '📊 การเปรียบเทียบ' as section,
  queue_number,
  customer_name,
  -- ดึงโค้ดจาก contact_info
  CASE 
    WHEN contact_info LIKE '%Code:%' THEN 
      TRIM(REGEXP_REPLACE(contact_info, '.*Code:\s*([^|]+).*', '\1'))
    ELSE 
      'ไม่พบโค้ดใน contact_info'
  END as code_from_contact_info,
  assigned_code,
  -- ตรวจสอบว่าตรงกันหรือไม่
  CASE 
    WHEN contact_info LIKE '%Code:%' AND 
         TRIM(REGEXP_REPLACE(contact_info, '.*Code:\s*([^|]+).*', '\1')) = assigned_code 
    THEN '✅ ตรงกัน'
    WHEN contact_info LIKE '%Code:%' AND 
         TRIM(REGEXP_REPLACE(contact_info, '.*Code:\s*([^|]+).*', '\1')) != assigned_code 
    THEN '❌ ไม่ตรงกัน - ต้องแก้ไข'
    ELSE '⚠️ ไม่มีโค้ดใน contact_info'
  END as comparison_status,
  TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_time
FROM queue_items
WHERE queue_number IN (590, 785)
ORDER BY queue_number;

-- 3. ตรวจสอบว่าโค้ด 50ROGA310A อยู่ในคิวไหน
SELECT 
  '🔎 ค้นหาโค้ด 50ROGA310A' as section,
  queue_number,
  customer_name,
  contact_info,
  assigned_code,
  CASE 
    WHEN contact_info LIKE '%50ROGA310A%' THEN '✅ อยู่ใน contact_info'
    ELSE '❌ ไม่อยู่ใน contact_info'
  END as in_contact_info,
  CASE 
    WHEN assigned_code = '50ROGA310A' THEN '✅ อยู่ใน assigned_code'
    ELSE '❌ ไม่อยู่ใน assigned_code'
  END as in_assigned_code,
  status,
  TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_time
FROM queue_items
WHERE queue_number IN (590, 785)
ORDER BY queue_number;

-- 4. ตรวจสอบ redemption_requests ที่เกี่ยวข้อง
SELECT 
  '🔗 Redemption Requests ที่เกี่ยวข้อง' as section,
  id,
  roblox_username,
  assigned_code,
  contact_info,
  TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_time
FROM app_284beb8f90_redemption_requests
WHERE assigned_code = '50ROGA310A'
   OR contact_info LIKE '%50ROGA310A%'
ORDER BY created_at DESC;

-- 5. แสดงประวัติของลูกค้าคนนี้ (ทุกคิว)
SELECT 
  '📜 ประวัติทั้งหมดของลูกค้า' as section,
  queue_number,
  -- ดึงโค้ดจาก contact_info
  CASE 
    WHEN contact_info LIKE '%Code:%' THEN 
      TRIM(REGEXP_REPLACE(contact_info, '.*Code:\s*([^|]+).*', '\1'))
    ELSE 
      '-'
  END as code,
  status,
  TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_time
FROM queue_items
WHERE customer_name IN (
  SELECT DISTINCT customer_name 
  FROM queue_items 
  WHERE queue_number IN (590, 785)
)
ORDER BY created_at DESC;

-- 6. สรุปผลการตรวจสอบ
SELECT 
  '📋 สรุปผล' as section,
  COUNT(*) as total_queues_checked,
  SUM(CASE 
    WHEN contact_info LIKE '%Code:%' AND 
         TRIM(REGEXP_REPLACE(contact_info, '.*Code:\s*([^|]+).*', '\1')) = assigned_code 
    THEN 1 ELSE 0 
  END) as codes_match,
  SUM(CASE 
    WHEN contact_info LIKE '%Code:%' AND 
         TRIM(REGEXP_REPLACE(contact_info, '.*Code:\s*([^|]+).*', '\1')) != assigned_code 
    THEN 1 ELSE 0 
  END) as codes_mismatch,
  SUM(CASE 
    WHEN contact_info LIKE '%50ROGA310A%' THEN 1 ELSE 0 
  END) as has_correct_code
FROM queue_items
WHERE queue_number IN (590, 785);

-- 📝 วิธีใช้งาน:
-- 1. รันไฟล์นี้ใน Supabase SQL Editor
-- 2. ตรวจสอบผลลัพธ์แต่ละ section
-- 3. ถ้า comparison_status = '❌ ไม่ตรงกัน' ให้รัน fix_duplicate_customer_code_issue.sql









