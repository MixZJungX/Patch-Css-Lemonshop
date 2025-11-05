-- เพิ่ม statement_timeout เพื่อป้องกัน timeout ในการ query
-- รัน SQL นี้ใน Supabase SQL Editor

-- เพิ่ม statement_timeout เป็น 60 วินาที (60000 milliseconds)
-- สำหรับ session ปัจจุบัน
SET statement_timeout = '60s';

-- สำหรับ database ทั้งหมด (ต้องเป็น superuser)
-- ALTER DATABASE postgres SET statement_timeout = '60s';

-- ตรวจสอบค่า statement_timeout ปัจจุบัน
SHOW statement_timeout;

-- หมายเหตุ:
-- - ค่า default ของ Supabase คือ 10 วินาที
-- - การเพิ่มเป็น 60 วินาทีจะช่วยให้ query ที่ซับซ้อนมีเวลาทำงานมากขึ้น
-- - แต่ควรแก้ไข query ให้เร็วขึ้นด้วยการใช้ limit และ indexes


