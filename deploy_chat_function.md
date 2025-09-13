# วิธี Deploy Chat System Edge Function

## 1. รัน SQL Script ก่อน
```sql
-- รันไฟล์ setup_chat_system.sql ใน Supabase SQL Editor
```

## 2. Deploy Edge Function

### วิธีที่ 1: ใช้ Supabase CLI
```bash
# ติดตั้ง Supabase CLI (ถ้ายังไม่มี)
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy function
supabase functions deploy app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_chat_system
```

### วิธีที่ 2: ใช้ Supabase Dashboard
1. เข้าไปที่ **Supabase Dashboard**
2. ไปที่ **Edge Functions**
3. คลิก **Create a new function**
4. ตั้งชื่อ: `app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_chat_system`
5. Copy โค้ดจากไฟล์ `supabase/functions/app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_chat_system/index.ts`
6. คลิก **Deploy**

## 3. ตั้งค่า Environment Variables
ใน Supabase Dashboard → Settings → Edge Functions:
- `SUPABASE_URL`: URL ของ project
- `SUPABASE_ANON_KEY`: Anon key ของ project

## 4. ทดสอบ
```bash
# ทดสอบ function
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_chat_system" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "create_conversation", "data": {"customer_id": "test123", "customer_name": "Test User"}}'
```

## 5. ตรวจสอบ Logs
- ไปที่ **Edge Functions** → **Logs**
- ดูว่ามี error หรือไม่

## 6. หากยังมีปัญหา
- ตรวจสอบ CORS settings
- ตรวจสอบ RLS policies
- ดู logs ใน Supabase Dashboard


