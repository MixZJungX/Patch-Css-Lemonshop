-- อัปเดตระบบแชทเพื่อรองรับฟีเจอร์แอดมิน
-- รันใน Supabase SQL Editor

-- 1. เพิ่มฟิลด์ใหม่ในตาราง messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'text';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. สร้าง storage bucket สำหรับรูปภาพแชท
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. ตั้งค่า RLS สำหรับ storage bucket
CREATE POLICY "Allow authenticated users to upload chat images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'chat-images' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow public access to chat images" ON storage.objects
FOR SELECT USING (bucket_id = 'chat-images');

CREATE POLICY "Allow authenticated users to delete chat images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'chat-images' AND 
  auth.role() = 'authenticated'
);

-- 4. อัปเดตข้อมูลเก่าให้มี message_type เป็น 'text'
UPDATE messages SET message_type = 'text' WHERE message_type IS NULL;

-- 5. เพิ่ม index สำหรับการค้นหา
CREATE INDEX IF NOT EXISTS idx_messages_message_type ON messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_image_url ON messages(image_url);

-- 6. ตรวจสอบผลลัพธ์
SELECT 'Chat system updated successfully for admin features' as status;
SELECT COUNT(*) as total_messages FROM messages;
SELECT message_type, COUNT(*) as count FROM messages GROUP BY message_type;
