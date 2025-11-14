-- 🚀 Enable Realtime for queue_items table
-- คัดลอกโค้ดนี้ไปรันใน Supabase SQL Editor

-- 1. Enable Realtime replication สำหรับตาราง queue_items
ALTER PUBLICATION supabase_realtime ADD TABLE queue_items;

-- 2. ตรวจสอบว่า Enable สำเร็จหรือยัง
SELECT 
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables
WHERE tablename = 'queue_items';

-- ✅ ถ้าเห็นแถวที่มี tablename = 'queue_items' แสดงว่าสำเร็จ!

-- 3. (Optional) ถ้าต้องการ Disable Realtime ในอนาคต ให้รัน:
-- ALTER PUBLICATION supabase_realtime DROP TABLE queue_items;

