# 🔧 แก้ไขปัญหาลูกค้าสั่งซ้ำแสดงโค้ดผิด

## 🐛 ปัญหาที่พบ

**คิว 590 และ 785** เป็นลูกค้าคนเดียวกันที่สั่งสินค้าเดิมซ้ำ ทำให้ระบบแสดงโค้ดเก่าแทนที่จะแสดงโค้ดใหม่ที่ถูกต้อง (`50ROGA310A`)

### สาเหตุ

1. **ข้อมูลจริงอยู่ใน `contact_info`** ของแต่ละคิว
2. **ระบบเดิม** พยายามจับคู่กับตาราง `redemption_requests` โดยดูจากชื่อลูกค้า
3. **เมื่อลูกค้าสั่งซ้ำ** ระบบจับคู่กับ `redemption_request` ตัวแรกที่เจอ (ซึ่งเป็นออเดอร์เก่า)
4. **ผลลัพธ์:** แสดงโค้ดเก่าแทนโค้ดใหม่ที่อยู่ใน `contact_info`

## ✅ วิธีแก้ไข

### 1. แก้ไขโค้ด (เสร็จแล้ว ✓)

ปรับปรุงไฟล์ `src/lib/queueApi.ts` ให้:

- **ดึงข้อมูลจาก `contact_info` เป็นหลัก** (PRIMARY SOURCE)
- **ใช้ `redemption_requests` เป็น fallback** เท่านั้น
- **ลำดับความสำคัญ:**
  ```
  assigned_code = codeFromContact || queueItem.assigned_code || matchingRedemption?.assigned_code
  ```

**การเปลี่ยนแปลงหลัก:**

1. ย้ายการดึงข้อมูลจาก `contact_info` มาด้านบนสุด
2. ปรับการจับคู่ `redemption_requests` ให้เข้มงวดขึ้น:
   - ถ้ามี Code ใน `contact_info` จะจับคู่โดยดู Code ที่ตรงกันก่อน
   - ไม่ใช้ Code เป็นเกณฑ์จับคู่หลักเพราะอาจซ้ำกันในกรณีสั่งซ้ำ
3. ใช้ข้อมูลจาก `contact_info` 100% ถ้ามีข้อมูลอยู่

### 2. แก้ไขข้อมูลในฐานข้อมูล (ถ้าจำเป็น)

รันไฟล์ `fix_duplicate_customer_code_issue.sql` ใน Supabase SQL Editor:

```sql
-- อัพเดตโค้ดจาก contact_info ให้ตรงกับ assigned_code
UPDATE queue_items
SET 
  assigned_code = regexp_replace(contact_info, '.*Code:\s*([^|]+).*', '\1'),
  updated_at = NOW()
WHERE contact_info LIKE '%Code:%'
  AND (
    assigned_code IS NULL 
    OR assigned_code = '' 
    OR assigned_code != regexp_replace(contact_info, '.*Code:\s*([^|]+).*', '\1')
  );
```

### 3. ตรวจสอบและทดสอบ

#### ตรวจสอบข้อมูลคิว 590 และ 785:

```sql
SELECT 
  queue_number,
  customer_name,
  regexp_replace(contact_info, '.*Code:\s*([^|]+).*', '\1') as code_from_contact_info,
  assigned_code,
  created_at
FROM queue_items
WHERE queue_number IN (590, 785)
ORDER BY queue_number;
```

#### ผลลัพธ์ที่คาดหวัง:

- คิว 590: แสดงโค้ดตาม `contact_info` ของคิว 590
- คิว 785: แสดงโค้ดตาม `contact_info` ของคิว 785 (`50ROGA310A`)

## 🎯 ผลลัพธ์

หลังจากแก้ไข:

1. ✅ ระบบจะดึงโค้ดจาก `contact_info` ของแต่ละคิวโดยตรง
2. ✅ ลูกค้าสั่งซ้ำจะเห็นโค้ดที่ถูกต้องสำหรับแต่ละคิว
3. ✅ ไม่มีปัญหาโค้ดเก่าแสดงแทนโค้ดใหม่อีกต่อไป

## 📋 ขั้นตอนการแก้ไข

### ขั้นที่ 1: Deploy โค้ดใหม่

```bash
# Deploy โค้ดที่แก้ไขแล้ว
npm run build
# หรือ
git add .
git commit -m "Fix: แก้ไขปัญหาลูกค้าสั่งซ้ำแสดงโค้ดเก่า - ดึงจาก contact_info เป็นหลัก"
git push
```

### ขั้นที่ 2: รัน SQL Script (ถ้าต้องการ)

1. เปิด Supabase Dashboard
2. ไปที่ SQL Editor
3. รันไฟล์ `fix_duplicate_customer_code_issue.sql`
4. ตรวจสอบผลลัพธ์

### ขั้นที่ 3: ทดสอบระบบ

1. เปิดหน้า Queue Status
2. ค้นหาคิว 590 และ 785
3. ตรวจสอบว่าแสดงโค้ดที่ถูกต้อง

## 🔍 การป้องกันปัญหานี้ในอนาคต

1. **ใช้ `contact_info` เป็น Single Source of Truth** สำหรับข้อมูลโค้ด
2. **ไม่พึ่งพา `redemption_requests`** สำหรับการแสดงผลโค้ด
3. **Validation:** ตรวจสอบว่า `assigned_code` ตรงกับโค้ดใน `contact_info` เสมอ

## 📞 ติดต่อ

หากพบปัญหาหรือมีคำถาม กรุณาติดต่อทีมพัฒนาระบบ






