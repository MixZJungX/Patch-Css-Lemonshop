-- แก้ไขโครงสร้างตาราง queue_items ให้ตรงกับโค้ด
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

-- 2. สร้างตาราง queue_items ใหม่ (ถ้าไม่มี)
CREATE TABLE IF NOT EXISTS queue_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  queue_number INTEGER UNIQUE NOT NULL,
  user_id UUID,
  contact_info TEXT NOT NULL,
  product_type TEXT NOT NULL DEFAULT 'robux',
  status TEXT NOT NULL DEFAULT 'waiting',
  priority INTEGER DEFAULT 0,
  estimated_wait_time INTEGER DEFAULT 15,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. สร้าง index สำหรับการค้นหา
CREATE INDEX IF NOT EXISTS idx_queue_items_status ON queue_items(status);
CREATE INDEX IF NOT EXISTS idx_queue_items_created_at ON queue_items(created_at);
CREATE INDEX IF NOT EXISTS idx_queue_items_queue_number ON queue_items(queue_number);
CREATE INDEX IF NOT EXISTS idx_queue_items_product_type ON queue_items(product_type);

-- 4. สร้าง function สำหรับอัปเดต updated_at อัตโนมัติ
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. สร้าง trigger สำหรับอัปเดต updated_at
DROP TRIGGER IF EXISTS update_queue_items_updated_at ON queue_items;
CREATE TRIGGER update_queue_items_updated_at 
    BEFORE UPDATE ON queue_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 6. ตรวจสอบ RLS (Row Level Security)
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'queue_items';

-- 7. หากต้องการเปิด RLS แบบง่าย (ถ้ายังไม่มี)
-- ALTER TABLE queue_items ENABLE ROW LEVEL SECURITY;

-- 8. สร้าง policy สำหรับการอ่านและเขียน (ถ้ายังไม่มี)
-- CREATE POLICY "Allow all operations on queue_items" ON queue_items
--   FOR ALL USING (true) WITH CHECK (true);

-- 9. ทดสอบการสร้างคิว
INSERT INTO queue_items (contact_info, product_type, status, estimated_wait_time)
VALUES ('ชื่อ: Test User | เบอร์โทร: 0123456789', 'robux', 'waiting', 15);

-- 10. ตรวจสอบว่าคิวถูกสร้างสำเร็จ
SELECT * FROM queue_items ORDER BY created_at DESC LIMIT 5;

-- 11. ลบคิวทดสอบ
DELETE FROM queue_items WHERE contact_info LIKE '%Test User%';

-- หมายเหตุ: 
-- - ตารางนี้จะรองรับเฉพาะข้อมูลพื้นฐานที่จำเป็น
-- - ข้อมูลเพิ่มเติมจะเก็บในตาราง redemption_requests
-- - การจับคู่ข้อมูลจะทำผ่าน contact_info
