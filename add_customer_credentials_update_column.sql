-- เพิ่มคอลัมน์สำหรับเก็บข้อมูลที่ลูกค้าอัปเดต
-- สำหรับตาราง queue_items

-- เพิ่มคอลัมน์ customer_updated_credentials (JSON)
ALTER TABLE queue_items
ADD COLUMN IF NOT EXISTS customer_updated_credentials JSONB DEFAULT NULL;

-- เพิ่ม comment อธิบายคอลัมน์
COMMENT ON COLUMN queue_items.customer_updated_credentials IS 
'เก็บข้อมูลที่ลูกค้าอัปเดตใหม่ในรูปแบบ JSON: { username, password, updated_at }';

-- ตัวอย่างข้อมูลที่จะเก็บ:
-- {
--   "username": "newusername123",
--   "password": "newpassword456", 
--   "updated_at": "2025-10-02T13:45:30.000Z",
--   "old_username": "oldusername",
--   "note": "ลูกค้าแก้ไขเอง"
-- }

-- ตรวจสอบว่าเพิ่มสำเร็จหรือไม่
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'queue_items'
AND column_name = 'customer_updated_credentials';

COMMIT;

