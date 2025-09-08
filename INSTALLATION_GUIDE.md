# Thai Robux Redemption System - คู่มือการติดตั้ง

## ข้อกำหนดระบบ
- Node.js เวอร์ชั่น 16+ 
- pnpm (แนะนำ) หรือ npm
- เบราว์เซอร์ที่รองรับ ES6+

## การติดตั้งและใช้งาน

### 1. แตกไฟล์
```bash
tar -xzf thai-robux-redemption-system.tar.gz
cd thai-robux-redemption-system
```

### 2. ติดตั้ง Dependencies
```bash
# ใช้ pnpm (แนะนำ)
pnpm install

# หรือใช้ npm
npm install
```

### 3. เริ่มต้นเซิร์ฟเวอร์
```bash
# Development mode
pnpm run dev
# หรือ
npm run dev
```

### 4. เข้าใช้งานระบบ
- เปิดเบราว์เซอร์ไปที่: `http://localhost:5173`
- หน้าแอดมิน: `http://localhost:5173/admin`

## คุณสมบัติหลัก

### 📋 จัดการคำขอแลกเปลี่ยน
- แสดงคำขอทั้งหมดในรูปแบบตาราง
- คอลัมน์: โค้ด, ชื่อ, รหัส, ประเภท, Contact, สถานะ, วันที่, จัดการ
- ปุ่มจัดการสถานะ: ดำเนินการ, เสร็จสิ้น, ยกเลิก

### 💎 จัดการโค้ด Robux
- เพิ่มโค้ดใหม่
- นำเข้าหลายรายการพร้อมกัน
- ติดตามสถานะการใช้งาน

### 🐔 จัดการบัญชีไก่ตัน
- เพิ่มบัญชีใหม่
- นำเข้าหลายบัญชีพร้อมกัน
- จัดการสถานะและรีเซ็ต

### 📊 แดชบอร์ดสถิติ
- จำนวนคำขอทั้งหมด
- คำขอรอดำเนินการ
- โค้ดและบัญชีพร้อมใช้งาน

## การปรับแต่งระบบ

### การเชื่อมต่อ Supabase
1. สร้างโปรเจ็กต์ใน [Supabase](https://supabase.com)
2. แก้ไขไฟล์ `src/lib/supabase.ts`
3. ใส่ URL และ API Key ของคุณ

### การปรับแต่ง UI
- แก้ไขไฟล์ใน `src/components/`
- ปรับสี CSS ใน `tailwind.config.ts`
- แก้ไขเลย์เอาต์ใน `src/pages/`

## Build สำหรับ Production
```bash
pnpm run build
# ผลลัพธ์จะอยู่ในโฟลเดอร์ dist/
```

## การแก้ไขปัญหา

### ปัญหา ESLint
```bash
pnpm add -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

### ปัญหา Dependencies
```bash
rm -rf node_modules package-lock.json
pnpm install
```

### ปัญหาการเชื่อมต่อฐานข้อมูล
- ตรวจสอบการตั้งค่า Supabase
- ดูใน Developer Tools (F12) สำหรับข้อผิดพลาด

## โครงสร้างโปรเจ็กต์
```
src/
├── components/         # React Components
├── pages/             # หน้าต่างๆ ของแอป
├── lib/               # การตั้งค่าและ utilities
├── contexts/          # React Context
├── hooks/             # Custom hooks
└── types/             # TypeScript types
```

## สนับสนุน
หากมีปัญหาในการใช้งาน กรุณาติดต่อผู้พัฒนาระบบ

---
🚀 **ระบบพร้อมใช้งาน!** รันคำสั่ง `pnpm run dev` แล้วเปิดเบราว์เซอร์ไปที่ `http://localhost:5173/admin`