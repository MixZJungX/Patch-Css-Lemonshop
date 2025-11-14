-- เพิ่ม indexes เพื่อเพิ่มประสิทธิภาพการ query
-- รัน SQL นี้ใน Supabase SQL Editor

-- Indexes สำหรับ queue_items table
CREATE INDEX IF NOT EXISTS idx_queue_items_status ON queue_items(status);
CREATE INDEX IF NOT EXISTS idx_queue_items_queue_number ON queue_items(queue_number);
CREATE INDEX IF NOT EXISTS idx_queue_items_created_at ON queue_items(created_at);
CREATE INDEX IF NOT EXISTS idx_queue_items_updated_at ON queue_items(updated_at);
CREATE INDEX IF NOT EXISTS idx_queue_items_status_created_at ON queue_items(status, created_at);
CREATE INDEX IF NOT EXISTS idx_queue_items_roblox_username ON queue_items(roblox_username);
CREATE INDEX IF NOT EXISTS idx_queue_items_customer_name ON queue_items(customer_name);
CREATE INDEX IF NOT EXISTS idx_queue_items_assigned_code ON queue_items(assigned_code);

-- Indexes สำหรับ redemption_requests table
CREATE INDEX IF NOT EXISTS idx_redemption_requests_created_at ON app_284beb8f90_redemption_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_redemption_requests_status ON app_284beb8f90_redemption_requests(status);
CREATE INDEX IF NOT EXISTS idx_redemption_requests_roblox_username ON app_284beb8f90_redemption_requests(roblox_username);
CREATE INDEX IF NOT EXISTS idx_redemption_requests_assigned_code ON app_284beb8f90_redemption_requests(assigned_code);
CREATE INDEX IF NOT EXISTS idx_redemption_requests_status_created_at ON app_284beb8f90_redemption_requests(status, created_at);

-- Indexes สำหรับ redemption_codes table
CREATE INDEX IF NOT EXISTS idx_redemption_codes_status ON app_284beb8f90_redemption_codes(status);
CREATE INDEX IF NOT EXISTS idx_redemption_codes_created_at ON app_284beb8f90_redemption_codes(created_at);

-- Indexes สำหรับ chicken_accounts table
CREATE INDEX IF NOT EXISTS idx_chicken_accounts_status ON app_284beb8f90_chicken_accounts(status);
CREATE INDEX IF NOT EXISTS idx_chicken_accounts_created_at ON app_284beb8f90_chicken_accounts(created_at);

-- Indexes สำหรับ rainbow_codes table
CREATE INDEX IF NOT EXISTS idx_rainbow_codes_is_used ON app_284beb8f90_rainbow_codes(is_used);
CREATE INDEX IF NOT EXISTS idx_rainbow_codes_created_at ON app_284beb8f90_rainbow_codes(created_at);

-- Indexes สำหรับ rainbow_requests table
CREATE INDEX IF NOT EXISTS idx_rainbow_requests_created_at ON app_284beb8f90_rainbow_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_rainbow_requests_status ON app_284beb8f90_rainbow_requests(status);

-- Indexes สำหรับ advertisements table
CREATE INDEX IF NOT EXISTS idx_advertisements_created_at ON app_284beb8f90_advertisements(created_at);

-- Indexes สำหรับ announcements table
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON app_284beb8f90_announcements(created_at);
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON app_284beb8f90_announcements(is_active);

-- Full text search indexes สำหรับการค้นหา
-- สำหรับ queue_items (contact_info)
CREATE INDEX IF NOT EXISTS idx_queue_items_contact_info_gin ON queue_items USING gin(to_tsvector('english', contact_info));

-- สำหรับ redemption_requests (contact_info, roblox_username)
CREATE INDEX IF NOT EXISTS idx_redemption_requests_contact_info_gin ON app_284beb8f90_redemption_requests USING gin(to_tsvector('english', contact_info));
CREATE INDEX IF NOT EXISTS idx_redemption_requests_roblox_username_gin ON app_284beb8f90_redemption_requests USING gin(to_tsvector('english', roblox_username));

-- ตรวจสอบ indexes ที่สร้างแล้ว
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN (
    'queue_items',
    'app_284beb8f90_redemption_requests',
    'app_284beb8f90_redemption_codes',
    'app_284beb8f90_chicken_accounts',
    'app_284beb8f90_rainbow_codes',
    'app_284beb8f90_rainbow_requests',
    'app_284beb8f90_advertisements',
    'app_284beb8f90_announcements'
)
ORDER BY tablename, indexname;


