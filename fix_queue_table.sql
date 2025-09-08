-- ตรวจสอบและแก้ไขตาราง queue_items
-- รันใน Supabase SQL Editor

-- 1. ตรวจสอบว่าตาราง queue_items มีอยู่หรือไม่
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'queue_items'
) as table_exists;

-- 2. หากไม่มีตาราง ให้สร้างใหม่
CREATE TABLE IF NOT EXISTS queue_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  queue_number INTEGER UNIQUE NOT NULL,
  user_id UUID,
  
  -- ข้อมูลลูกค้า
  roblox_username TEXT,
  roblox_password TEXT,
  robux_amount INTEGER,
  contact_info TEXT NOT NULL,
  
  -- ข้อมูลโค้ด
  code_id UUID,
  assigned_code TEXT,
  assigned_account_code TEXT,
  
  -- ข้อมูลคิว
  product_type TEXT NOT NULL DEFAULT 'robux',
  status TEXT NOT NULL DEFAULT 'waiting',
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  estimated_wait_time INTEGER DEFAULT 15,
  admin_notes TEXT
);

-- 3. สร้าง index สำหรับการค้นหา
CREATE INDEX IF NOT EXISTS idx_queue_items_status ON queue_items(status);
CREATE INDEX IF NOT EXISTS idx_queue_items_created_at ON queue_items(created_at);
CREATE INDEX IF NOT EXISTS idx_queue_items_queue_number ON queue_items(queue_number);

-- 4. ตรวจสอบโครงสร้างตาราง
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'queue_items' 
ORDER BY ordinal_position;

-- 5. ตรวจสอบ RLS (Row Level Security)
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

-- 6. หากต้องการเปิด RLS แบบง่าย
-- ALTER TABLE queue_items ENABLE ROW LEVEL SECURITY;

-- 7. สร้าง policy สำหรับการอ่านข้อมูลทั้งหมด (สำหรับแอปพลิเคชัน)
DROP POLICY IF EXISTS "Enable read access for all users" ON queue_items;
CREATE POLICY "Enable read access for all users" ON queue_items
  FOR SELECT USING (true);

-- 8. สร้าง policy สำหรับการเขียนข้อมูล (สำหรับแอปพลิเคชัน)
DROP POLICY IF EXISTS "Enable insert access for all users" ON queue_items;
CREATE POLICY "Enable insert access for all users" ON queue_items
  FOR INSERT WITH CHECK (true);

-- 9. สร้าง policy สำหรับการอัปเดตข้อมูล (สำหรับแอปพลิเคชัน)
DROP POLICY IF EXISTS "Enable update access for all users" ON queue_items;
CREATE POLICY "Enable update access for all users" ON queue_items
  FOR UPDATE USING (true);

-- 10. สร้าง policy สำหรับการลบข้อมูล (สำหรับแอปพลิเคชัน)
DROP POLICY IF EXISTS "Enable delete access for all users" ON queue_items;
CREATE POLICY "Enable delete access for all users" ON queue_items
  FOR DELETE USING (true);

-- มาตรวจสอบข้อมูลในตาราง
SELECT COUNT(*) as total_items FROM queue_items;

-- หากต้องการลบข้อมูลทั้งหมด (ระวัง!)
-- DELETE FROM queue_items;
