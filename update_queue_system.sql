-- อัปเดตระบบคิวให้เก็บข้อมูลครบถ้วน
-- รันใน Supabase SQL Editor

-- 1. เพิ่มคอลัมน์ใหม่ในตาราง queue_items
ALTER TABLE queue_items ADD COLUMN IF NOT EXISTS roblox_username TEXT;
ALTER TABLE queue_items ADD COLUMN IF NOT EXISTS roblox_password TEXT;
ALTER TABLE queue_items ADD COLUMN IF NOT EXISTS robux_amount INTEGER;
ALTER TABLE queue_items ADD COLUMN IF NOT EXISTS code_id UUID;
ALTER TABLE queue_items ADD COLUMN IF NOT EXISTS assigned_code TEXT;
ALTER TABLE queue_items ADD COLUMN IF NOT EXISTS assigned_account_code TEXT;

-- 2. อัปเดต view ก่อนลบคอลัมน์
-- อัปเดต waiting_queue view
DROP VIEW IF EXISTS waiting_queue;
CREATE VIEW waiting_queue AS
SELECT 
    id,
    queue_number,
    roblox_username as customer_name,
    contact_info,
    product_type,
    created_at,
    estimated_wait_time,
    ROW_NUMBER() OVER (ORDER BY created_at) as position
FROM queue_items 
WHERE status = 'waiting'
ORDER BY created_at;

-- อัปเดต processing_queue view
DROP VIEW IF EXISTS processing_queue;
CREATE VIEW processing_queue AS
SELECT 
    id,
    queue_number,
    roblox_username as customer_name,
    contact_info,
    product_type,
    created_at,
    updated_at,
    estimated_wait_time
FROM queue_items 
WHERE status = 'processing'
ORDER BY updated_at;

-- 3. ลบคอลัมน์เก่าที่ไม่ใช้แล้ว
ALTER TABLE queue_items DROP COLUMN IF EXISTS customer_name;
ALTER TABLE queue_items DROP COLUMN IF EXISTS redemption_request_id;

-- 4. อัปเดตข้อมูลที่มีอยู่ (ถ้ามี)
-- ตรวจสอบว่ามีคอลัมน์ redemption_request_id หรือไม่
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'queue_items' 
        AND column_name = 'redemption_request_id'
    ) THEN
        -- ถ้ามีคอลัมน์ redemption_request_id ให้อัปเดตข้อมูล
        UPDATE queue_items 
        SET 
          roblox_username = r.roblox_username,
          roblox_password = r.roblox_password,
          robux_amount = r.robux_amount,
          code_id = r.code_id,
          assigned_code = r.assigned_code
        FROM app_284beb8f90_redemption_requests r
        WHERE queue_items.redemption_request_id = r.id;
    ELSE
        -- ถ้าไม่มีคอลัมน์ redemption_request_id ให้ข้ามการอัปเดต
        RAISE NOTICE 'ไม่มีคอลัมน์ redemption_request_id ในตาราง queue_items';
    END IF;
END $$;

-- 5. ลบตาราง redemption_requests (หลังจากย้ายข้อมูลแล้ว)
-- DROP TABLE IF EXISTS app_284beb8f90_redemption_requests;

-- 6. ตรวจสอบโครงสร้างตาราง
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'queue_items' 
ORDER BY ordinal_position;

-- หมายเหตุ: 
-- - ลบ DROP TABLE ในขั้นตอนที่ 4 ออกถ้ายังไม่แน่ใจ
-- - รันทีละขั้นตอนเพื่อความปลอดภัย
-- - แนะนำให้ backup ข้อมูลก่อนรัน
