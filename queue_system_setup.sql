-- ระบบคิวสำหรับ Thai Robux Redemption System
-- สร้างตาราง queue_items

CREATE TABLE IF NOT EXISTS queue_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_number INTEGER UNIQUE NOT NULL,
  user_id UUID,
  redemption_request_id UUID,
  customer_name TEXT,
  contact_info TEXT,
  product_type TEXT CHECK (product_type IN ('robux', 'chicken', 'rainbow')) NOT NULL,
  status TEXT CHECK (status IN ('waiting', 'processing', 'completed', 'cancelled')) DEFAULT 'waiting',
  priority INTEGER DEFAULT 0,
  estimated_wait_time INTEGER, -- เวลาในนาที
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- สร้าง index สำหรับการค้นหาและเรียงลำดับ
CREATE INDEX IF NOT EXISTS idx_queue_items_status ON queue_items(status);
CREATE INDEX IF NOT EXISTS idx_queue_items_created_at ON queue_items(created_at);
CREATE INDEX IF NOT EXISTS idx_queue_items_queue_number ON queue_items(queue_number);
CREATE INDEX IF NOT EXISTS idx_queue_items_product_type ON queue_items(product_type);

-- สร้าง function สำหรับอัปเดต updated_at อัตโนมัติ
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- สร้าง trigger สำหรับอัปเดต updated_at
CREATE TRIGGER update_queue_items_updated_at 
    BEFORE UPDATE ON queue_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- สร้าง function สำหรับสร้างหมายเลขคิวแบบเรียงลำดับ
CREATE OR REPLACE FUNCTION generate_sequential_queue_number()
RETURNS INTEGER AS $$
DECLARE
    next_number INTEGER;
BEGIN
    -- ดึงหมายเลขคิวสูงสุดที่ยังไม่เสร็จ
    SELECT COALESCE(MAX(queue_number), 0) + 1
    INTO next_number
    FROM queue_items 
    WHERE status IN ('waiting', 'processing');
    
    RETURN next_number;
END;
$$ LANGUAGE plpgsql;

-- สร้าง view สำหรับแสดงคิวที่รอ
CREATE OR REPLACE VIEW waiting_queue AS
SELECT 
    id,
    queue_number,
    customer_name,
    contact_info,
    product_type,
    created_at,
    estimated_wait_time,
    ROW_NUMBER() OVER (ORDER BY created_at) as position
FROM queue_items 
WHERE status = 'waiting'
ORDER BY created_at;

-- สร้าง view สำหรับแสดงคิวที่กำลังดำเนินการ
CREATE OR REPLACE VIEW processing_queue AS
SELECT 
    id,
    queue_number,
    customer_name,
    contact_info,
    product_type,
    created_at,
    updated_at,
    estimated_wait_time
FROM queue_items 
WHERE status = 'processing'
ORDER BY updated_at;

-- เพิ่ม RLS (Row Level Security) ถ้าต้องการ
-- ALTER TABLE queue_items ENABLE ROW LEVEL SECURITY;

-- สร้าง policy สำหรับการเข้าถึงข้อมูล (ถ้าใช้ RLS)
-- CREATE POLICY "Allow public read access" ON queue_items FOR SELECT USING (true);
-- CREATE POLICY "Allow authenticated insert" ON queue_items FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow admin update" ON queue_items FOR UPDATE USING (true);

-- ตัวอย่างข้อมูลทดสอบ (ถ้าต้องการ)
-- INSERT INTO queue_items (queue_number, customer_name, contact_info, product_type, estimated_wait_time) VALUES
-- (847, 'ลูกค้า A', '0812345678', 'robux', 15),
-- (392, 'ลูกค้า B', '0823456789', 'chicken', 10),
-- (156, 'ลูกค้า C', '0834567890', 'rainbow', 20);

COMMENT ON TABLE queue_items IS 'ตารางสำหรับจัดการระบบคิว';
COMMENT ON COLUMN queue_items.queue_number IS 'หมายเลขคิวแบบเรียงลำดับ (1, 2, 3, ...)';
COMMENT ON COLUMN queue_items.product_type IS 'ประเภทสินค้า: robux, chicken, rainbow';
COMMENT ON COLUMN queue_items.status IS 'สถานะคิว: waiting, processing, completed, cancelled';
COMMENT ON COLUMN queue_items.estimated_wait_time IS 'เวลารอโดยประมาณ (นาที)';
