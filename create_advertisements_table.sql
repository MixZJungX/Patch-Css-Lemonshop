-- สร้างตาราง advertisements สำหรับระบบ popup โฆษณา
CREATE TABLE IF NOT EXISTS app_284beb8f90_advertisements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    link_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- เพิ่ม RLS (Row Level Security)
ALTER TABLE app_284beb8f90_advertisements ENABLE ROW LEVEL SECURITY;

-- สร้าง policy สำหรับการอ่านข้อมูล (ทุกคนสามารถอ่านได้)
CREATE POLICY "Allow public read access" ON app_284beb8f90_advertisements
    FOR SELECT USING (true);

-- สร้าง policy สำหรับการเขียนข้อมูล (เฉพาะ authenticated users)
CREATE POLICY "Allow authenticated users to insert" ON app_284beb8f90_advertisements
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update" ON app_284beb8f90_advertisements
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete" ON app_284beb8f90_advertisements
    FOR DELETE USING (auth.role() = 'authenticated');

-- สร้าง function สำหรับอัพเดท updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- สร้าง trigger สำหรับอัพเดท updated_at
CREATE TRIGGER update_advertisements_updated_at 
    BEFORE UPDATE ON app_284beb8f90_advertisements 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- เพิ่มข้อมูลตัวอย่าง
INSERT INTO app_284beb8f90_advertisements (title, image_url, link_url, is_active) VALUES
('โปรโมชั่นพิเศษ!', 'https://img5.pic.in.th/file/secure-sv1/2318a16a76694dc8dccbd75362a64368deb68b00127501b51b1a9a0588ca2f42.png', 'https://lemonshop.rdcw.xyz/', true),
('ซื้อ Robux ถูกๆ', 'https://img5.pic.in.th/file/secure-sv1/2318a16a76694dc8dccbd75362a64368deb68b00127501b51b1a9a0588ca2f42.png', 'https://lemonshop.rdcw.xyz/', false);

-- แสดงข้อมูลที่สร้าง
SELECT * FROM app_284beb8f90_advertisements;
