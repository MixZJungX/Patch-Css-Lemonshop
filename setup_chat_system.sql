-- สร้างระบบแชทสำหรับลูกค้าและแอดมิน
-- รันใน Supabase SQL Editor

-- 1. สร้างตาราง conversations
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. สร้างตาราง messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('customer', 'admin')),
    sender_id VARCHAR(255),
    message_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. สร้าง indexes
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);

-- 4. สร้างฟังก์ชันสำหรับอัพเดท updated_at
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET updated_at = NOW(), last_message_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. สร้าง trigger
DROP TRIGGER IF EXISTS trigger_update_conversation_updated_at ON messages;
CREATE TRIGGER trigger_update_conversation_updated_at
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_updated_at();

-- 6. สร้าง view สำหรับดูข้อมูลการสนทนา
CREATE OR REPLACE VIEW conversation_summary AS
SELECT 
    c.id,
    c.customer_id,
    c.customer_name,
    c.status,
    c.created_at,
    c.updated_at,
    c.last_message_at,
    COUNT(m.id) as message_count,
    COUNT(CASE WHEN m.is_read = FALSE AND m.sender_type = 'customer' THEN 1 END) as unread_customer_messages,
    (SELECT message_text FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
FROM conversations c
LEFT JOIN messages m ON c.id = m.conversation_id
GROUP BY c.id, c.customer_id, c.customer_name, c.status, c.created_at, c.updated_at, c.last_message_at;

-- 7. ตั้งค่า RLS (Row Level Security)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 8. สร้าง policies สำหรับ conversations
DROP POLICY IF EXISTS "Allow all operations on conversations" ON conversations;
CREATE POLICY "Allow all operations on conversations" ON conversations
    FOR ALL USING (true);

-- 9. สร้าง policies สำหรับ messages
DROP POLICY IF EXISTS "Allow all operations on messages" ON messages;
CREATE POLICY "Allow all operations on messages" ON messages
    FOR ALL USING (true);

-- 10. ตรวจสอบผลลัพธ์
SELECT 'Tables created successfully' as status;
SELECT table_name FROM information_schema.tables WHERE table_name IN ('conversations', 'messages');
SELECT viewname FROM pg_views WHERE viewname = 'conversation_summary';


