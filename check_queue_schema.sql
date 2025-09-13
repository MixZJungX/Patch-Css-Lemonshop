-- ตรวจสอบโครงสร้างตาราง queue_items ในฐานข้อมูลจริง
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'queue_items' 
ORDER BY ordinal_position;

-- ตรวจสอบข้อมูลตัวอย่างในตาราง
SELECT * FROM queue_items LIMIT 3;
