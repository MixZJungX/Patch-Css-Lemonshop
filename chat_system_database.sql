-- สร้างตารางสำหรับระบบแชท
-- ตารางสำหรับเก็บข้อมูลการสนทนา
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id VARCHAR(255) NOT NULL, -- รหัสลูกค้า
    customer_name VARCHAR(255), -- ชื่อลูกค้า (ถ้ามี)
    status VARCHAR(50) DEFAULT 'active', -- active, closed, resolved
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ตารางสำหรับเก็บข้อความ
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL, -- 'customer' หรือ 'admin'
    sender_id VARCHAR(255), -- รหัสผู้ส่ง (customer_id หรือ admin_id)
    message_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- สร้าง index เพื่อเพิ่มประสิทธิภาพ
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);

-- สร้างฟังก์ชันสำหรับอัพเดท updated_at
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET updated_at = NOW(), last_message_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- สร้าง trigger สำหรับอัพเดท updated_at เมื่อมีข้อความใหม่
CREATE TRIGGER trigger_update_conversation_updated_at
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_updated_at();

-- สร้าง view สำหรับดูข้อมูลการสนทนาพร้อมข้อความล่าสุด
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

-- ตัวอย่างข้อมูลสำหรับทดสอบ
INSERT INTO conversations (customer_id, customer_name, status) VALUES 
('TEST001', 'ลูกค้าทดสอบ', 'active')
ON CONFLICT DO NOTHING;


