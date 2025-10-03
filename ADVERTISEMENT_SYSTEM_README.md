# ระบบ Popup โฆษณา

## วิธีการใช้งาน

### 1. สร้างตารางใน Supabase
รัน SQL script `create_advertisements_table.sql` ใน Supabase SQL Editor

### 2. โครงสร้างตาราง
```sql
app_284beb8f90_advertisements
├── id (UUID) - Primary Key
├── title (VARCHAR) - ชื่อโฆษณา
├── image_url (TEXT) - URL รูปภาพโฆษณา
├── link_url (TEXT) - ลิงก์เมื่อคลิกโฆษณา (ไม่บังคับ)
├── is_active (BOOLEAN) - สถานะการแสดง (true/false)
├── created_at (TIMESTAMP) - วันที่สร้าง
└── updated_at (TIMESTAMP) - วันที่อัพเดท
```

### 3. การเพิ่มโฆษณา
```sql
INSERT INTO app_284beb8f90_advertisements (title, image_url, link_url, is_active) 
VALUES ('ชื่อโฆษณา', 'https://example.com/image.png', 'https://example.com', true);
```

### 4. การจัดการโฆษณา
- **เปิด/ปิดโฆษณา**: เปลี่ยน `is_active` เป็น `true/false`
- **แก้ไขโฆษณา**: อัพเดทข้อมูลในตาราง
- **ลบโฆษณา**: DELETE จากตาราง

### 5. ฟีเจอร์
- ✅ แสดง popup เมื่อเข้าเว็บ
- ✅ จำการปิด popup (localStorage)
- ✅ คลิกโฆษณาเพื่อเปิดลิงก์
- ✅ รองรับรูปภาพและลิงก์
- ✅ ระบบเปิด/ปิดโฆษณา

### 6. ตัวอย่างการใช้งาน
```sql
-- เพิ่มโฆษณาใหม่
INSERT INTO app_284beb8f90_advertisements (title, image_url, link_url, is_active) 
VALUES ('โปรโมชั่น Robux', 'https://img5.pic.in.th/file/secure-sv1/2318a16a76694dc8dccbd75362a64368deb68b00127501b51b1a9a0588ca2f42.png', 'https://lemonshop.rdcw.xyz/', true);

-- ปิดโฆษณา
UPDATE app_284beb8f90_advertisements SET is_active = false WHERE id = 'your-ad-id';

-- เปิดโฆษณา
UPDATE app_284beb8f90_advertisements SET is_active = true WHERE id = 'your-ad-id';
```

## หมายเหตุ
- Popup จะแสดงหลังจากเข้าเว็บ 1 วินาที
- ถ้าผู้ใช้ปิด popup แล้ว จะไม่แสดงซ้ำ (จำไว้ใน localStorage)
- ระบบจะแสดงโฆษณาที่ `is_active = true` ล่าสุด
