-- แก้ไขปัญหา Chat System อย่างเร่งด่วน
-- รันใน Supabase SQL Editor

-- 1. สร้างตาราง conversations (ถ้ายังไม่มี)
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. สร้างตาราง messages (ถ้ายังไม่มี)
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('customer', 'admin')),
    sender_id VARCHAR(255),
    message_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ตั้งค่า RLS ให้อนุญาตทุกอย่าง (ชั่วคราว)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ลบ policies เก่า
DROP POLICY IF EXISTS "Allow all operations on conversations" ON conversations;
DROP POLICY IF EXISTS "Allow all operations on messages" ON messages;

-- สร้าง policies ใหม่ที่อนุญาตทุกอย่าง
CREATE POLICY "Allow all operations on conversations" ON conversations
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on messages" ON messages
    FOR ALL USING (true) WITH CHECK (true);

-- 4. สร้าง indexes
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

-- 5. ทดสอบสร้างข้อมูล
INSERT INTO conversations (customer_id, customer_name) 
VALUES ('test123', 'Test User')
ON CONFLICT DO NOTHING;

-- 6. ตรวจสอบผลลัพธ์
SELECT 'Chat system tables created successfully' as status;
SELECT COUNT(*) as conversation_count FROM conversations;
SELECT COUNT(*) as message_count FROM messages;






