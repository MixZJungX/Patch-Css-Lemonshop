-- เพิ่มสถานะ 'customer_fixed' เข้าไปใน enum ของคอลัมน์ status
-- สำหรับตาราง queue_items

-- วิธีที่ 1: ใช้ ALTER TYPE (สำหรับ PostgreSQL)
-- หมายเหตุ: ถ้า status เป็น enum type ให้ใช้คำสั่งนี้
DO $$ 
BEGIN
    -- ตรวจสอบว่ามี enum type หรือไม่
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'queue_status') THEN
        -- เพิ่มค่า customer_fixed ถ้ายังไม่มี
        ALTER TYPE queue_status ADD VALUE IF NOT EXISTS 'customer_fixed';
        RAISE NOTICE 'เพิ่มค่า customer_fixed เข้าไปใน enum queue_status สำเร็จ';
    ELSE
        RAISE NOTICE 'ไม่พบ enum type ชื่อ queue_status - อาจเป็น TEXT type';
    END IF;
END $$;

-- วิธีที่ 2: ถ้า status เป็น TEXT (ไม่ใช่ enum)
-- ไม่ต้องทำอะไร - TEXT รับค่าอะไรก็ได้

-- วิธีที่ 3: ถ้า status เป็น CHECK constraint
-- ต้อง DROP constraint เดิมแล้วสร้างใหม่
DO $$ 
BEGIN
    -- ลบ constraint เดิม (ถ้ามี)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.constraint_column_usage 
        WHERE table_name = 'queue_items' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE queue_items 
        DROP CONSTRAINT IF EXISTS queue_items_status_check;
        
        RAISE NOTICE 'ลบ constraint เดิมสำเร็จ';
    END IF;
    
    -- สร้าง constraint ใหม่ที่รวม customer_fixed
    ALTER TABLE queue_items
    ADD CONSTRAINT queue_items_status_check 
    CHECK (status IN (
        'waiting',
        'processing', 
        'completed',
        'cancelled',
        'problem',
        'customer_fixed'
    ));
    
    RAISE NOTICE 'เพิ่ม constraint ใหม่พร้อม customer_fixed สำเร็จ';
END $$;

-- ตรวจสอบว่าเพิ่มสำเร็จหรือไม่
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_name = 'queue_items'
AND column_name = 'status';

-- ทดสอบว่าสามารถใช้งานได้หรือไม่ (ไม่บังคับ)
-- SELECT * FROM queue_items WHERE status = 'customer_fixed' LIMIT 1;

COMMIT;

