-- แก้ไขปัญหาหมายเลขคิวซ้ำกัน
-- ไฟล์นี้จะลบข้อมูลคิวทั้งหมดและรีเซ็ตลำดับหมายเลขคิว

-- 1. ลบข้อมูลคิวทั้งหมด
DELETE FROM queue_items;

-- 2. รีเซ็ตลำดับ (sequence) หากมี
-- ถ้าใช้ PostgreSQL และมี sequence
-- SELECT setval('queue_items_id_seq', 1, false);
-- SELECT setval('queue_items_queue_number_seq', 1, false);

-- 3. ตรวจสอบว่าลบข้อมูลหมดแล้ว
SELECT COUNT(*) as remaining_items FROM queue_items;

-- 4. แสดงโครงสร้างตารางเพื่อตรวจสอบ
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'queue_items';

-- หมายเหตุ: หลังจากรัน script นี้ ระบบจะเริ่มสร้างหมายเลขคิวใหม่ที่ 1
-- ลูกค้าทั้งหมดจะต้องแลกโค้ดใหม่เพื่อได้รับหมายเลขคิว
