# 🔧 การแก้ไขปัญหาปุ่มลบในหน้าคำขอ (เวอร์ชัน 2)

## 🚨 ปัญหาที่พบ
ปุ่มลบในหน้าคำขอทำงานชั่วคราว (ข้อมูลหายไปจาก UI) แต่เมื่อรีเฟรชหน้าข้อมูลก็กลับมา เพราะการลบจากฐานข้อมูลไม่สำเร็จ

## 🔍 สาเหตุของปัญหา
1. **RLS (Row Level Security) Policies** - นโยบายความปลอดภัยในฐานข้อมูลบล็อกการลบข้อมูล
2. **สิทธิ์ไม่เพียงพอ** - Client-side ไม่มีสิทธิ์ในการลบข้อมูลโดยตรง
3. **การตรวจสอบไม่ครบถ้วน** - ไม่มีการยืนยันว่าการลบสำเร็จจริง

## ✅ การแก้ไขใหม่

### 1. สร้าง Edge Function สำหรับลบข้อมูล
สร้างไฟล์ `supabase/functions/app_284beb8f90_delete_request/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Create Supabase client with Auth context
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  )

  const { requestId, requestType } = await req.json()

  // Determine table name
  let tableName = 'app_284beb8f90_redemption_requests'
  if (requestType === 'rainbow') {
    tableName = 'app_284beb8f90_rainbow_requests'
  }

  // Check if request exists first
  const { data: existingRequest, error: selectError } = await supabaseClient
    .from(tableName)
    .select('id')
    .eq('id', requestId)
    .single()

  if (selectError) {
    // Try alternative table
    const otherTable = tableName === 'app_284beb8f90_rainbow_requests' 
      ? 'app_284beb8f90_redemption_requests' 
      : 'app_284beb8f90_rainbow_requests'
    
    const { data: altExistingRequest, error: altSelectError } = await supabaseClient
      .from(otherTable)
      .select('id')
      .eq('id', requestId)
      .single()
    
    if (altSelectError) {
      return new Response(
        JSON.stringify({ error: 'Request not found' }),
        { status: 404, headers: corsHeaders }
      )
    }
    
    tableName = otherTable
  }

  // Delete the request
  const { data: deletedData, error: deleteError } = await supabaseClient
    .from(tableName)
    .delete()
    .eq('id', requestId)
    .select()

  if (deleteError || !deletedData || deletedData.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Delete failed' }),
      { status: 500, headers: corsHeaders }
    )
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Request deleted successfully',
      deletedData,
      tableName
    }),
    { status: 200, headers: corsHeaders }
  )
})
```

### 2. ปรับปรุงฟังก์ชัน `deleteRequest` ใน Admin.tsx

```typescript
const deleteRequest = async (id: string) => {
  console.log('🚀 deleteRequest called with ID:', id);
  
  // ตรวจสอบสิทธิ์ของผู้ใช้
  if (!user) {
    console.error('❌ User not authenticated');
    toast.error('กรุณาเข้าสู่ระบบก่อน');
    return;
  }
  
  if (!confirm('คุณแน่ใจหรือไม่ที่ต้องการลบคำขอนี้? การดำเนินการนี้ไม่สามารถยกเลิกได้')) {
    console.log('❌ User cancelled deletion');
    return;
  }

  try {
    // ตรวจสอบประเภทคำขอ
    const rainbowRequest = rainbowRequests.find(req => req.id === id);
    const requestType = rainbowRequest ? 'rainbow' : 'regular';
    
    // เรียกใช้ Edge Function
    const { data: functionResult, error: functionError } = await supabase.functions.invoke(
      'app_284beb8f90_delete_request',
      {
        body: {
          requestId: id,
          requestType: requestType
        }
      }
    );
    
    if (functionError || !functionResult?.success) {
      throw new Error(functionResult?.error || 'การลบไม่สำเร็จ');
    }
    
    // อัพเดท UI หลังจากยืนยันว่าการลบสำเร็จ
    setRequests(prevRequests => prevRequests.filter(req => req.id !== id));
    setRainbowRequests(prevRequests => prevRequests.filter(req => req.id !== id));
    
    toast.success('ลบคำขอสำเร็จ');
  } catch (error) {
    console.error('Delete error:', error);
    toast.error(`เกิดข้อผิดพลาดในการลบคำขอ: ${error.message}`);
  }
};
```

## 🚀 ข้อดีของการแก้ไขใหม่

1. **ใช้ Edge Function** - มีสิทธิ์เต็มในการเข้าถึงฐานข้อมูล
2. **ตรวจสอบการลบจริง** - ยืนยันว่าข้อมูลถูกลบจากฐานข้อมูล
3. **จัดการ Error ดีขึ้น** - แสดงข้อความ error ที่ชัดเจน
4. **ไม่มีการอัพเดท UI ก่อนยืนยัน** - ป้องกันการแสดงผลผิดพลาด

## 🧪 วิธีการทดสอบ

1. **Deploy Edge Function**:
   ```bash
   supabase functions deploy app_284beb8f90_delete_request
   ```

2. **ทดสอบปุ่มลบ**:
   - เปิด Developer Console (F12)
   - คลิกปุ่มลบในตารางคำขอ
   - ตรวจสอบ Console Log
   - รีเฟรชหน้าเพื่อยืนยันว่าข้อมูลหายไปจริง

3. **ตรวจสอบ Edge Function Logs**:
   ```bash
   supabase functions logs app_284beb8f90_delete_request
   ```

## 📋 สิ่งที่ต้องตรวจสอบ

- [ ] Edge Function deploy สำเร็จ
- [ ] ปุ่มลบทำงานเมื่อคลิก
- [ ] Confirm dialog แสดงขึ้นมา
- [ ] ข้อมูลถูกลบจากฐานข้อมูลจริง
- [ ] UI อัพเดททันที
- [ ] ข้อมูลไม่กลับมาหลังรีเฟรช
- [ ] Error message แสดงเมื่อเกิดปัญหา

## 🔄 การ Rollback

หากต้องการย้อนกลับ:
```bash
# ลบ Edge Function
supabase functions delete app_284beb8f90_delete_request

# ย้อนกลับโค้ด Admin.tsx
git checkout HEAD~1 src/pages/Admin.tsx
```

## 📞 การติดต่อ

หากยังมีปัญหา กรุณาติดต่อพร้อมข้อมูล:
- Edge Function logs
- Console log
- Error message
- ขั้นตอนการทำซ้ำ

