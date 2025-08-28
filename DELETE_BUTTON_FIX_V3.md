# 🔧 การแก้ไขปัญหาปุ่มลบในหน้าคำขอ (เวอร์ชัน 3)

## 🚨 ปัญหาที่พบ
- ปุ่มลบในหน้าคำขอทำงานชั่วคราว (ข้อมูลหายไปจาก UI) แต่เมื่อรีเฟรชหน้าข้อมูลก็กลับมา
- Edge Function ไม่สามารถ deploy ได้เนื่องจากปัญหา Supabase CLI
- เกิดข้อผิดพลาด: "Edge function error: Failed to send a request to the Edge Function"

## 🔍 สาเหตุของปัญหา
1. **RLS (Row Level Security) Policies** - นโยบายความปลอดภัยในฐานข้อมูลบล็อกการลบข้อมูล
2. **Edge Function ไม่ได้ deploy** - เนื่องจากปัญหา Supabase CLI
3. **สิทธิ์ไม่เพียงพอ** - Client-side ไม่มีสิทธิ์ในการลบข้อมูลโดยตรง

## ✅ การแก้ไขใหม่

### 1. ใช้ adminApi แทน Edge Function
เพิ่มฟังก์ชัน `deleteRequest` ใน `src/lib/adminApi.ts`:

```typescript
// Delete request
deleteRequest: (id: string, requestType: string) => {
  const table = requestType === 'rainbow' 
    ? 'app_284beb8f90_rainbow_requests' 
    : 'app_284beb8f90_redemption_requests';
  
  return executeAdminOperation({
    operation: 'delete',
    table,
    id
  });
}
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
    const regularRequest = requests.find(req => req.id === id);
    
    let tableName = 'app_284beb8f90_redemption_requests'; // default
    let requestType = 'regular';
    
    if (rainbowRequest) {
      tableName = 'app_284beb8f90_rainbow_requests';
      requestType = 'rainbow';
      console.log('🗑️ Found Rainbow Six request, using table:', tableName);
    } else if (regularRequest) {
      console.log('🗑️ Found regular request, using table:', tableName);
    } else {
      console.log('⚠️ Request not found in either array, trying both tables');
    }

    // ลองลบจากตารางแรก
    let { data, error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('❌ Delete failed from table:', tableName, error);
      
      // ตรวจสอบว่าเป็นปัญหา RLS หรือไม่
      if (error.message.includes('permission') || error.message.includes('policy')) {
        console.log('🔒 RLS policy issue detected, trying adminApi...');
        
        // ลองใช้ adminApi แทน
        try {
          const result = await adminApi.deleteRequest(id, requestType);
          if (result.error) {
            throw new Error(result.error);
          }
          console.log('✅ Successfully deleted via adminApi');
        } catch (adminError) {
          console.error('❌ AdminApi delete failed:', adminError);
          throw new Error(`ไม่สามารถลบข้อมูลได้: ${adminError.message}`);
        }
      } else {
        // ลองตารางที่สองถ้าตารางแรกไม่สำเร็จ
        const otherTable = tableName === 'app_284beb8f90_rainbow_requests' 
          ? 'app_284beb8f90_redemption_requests' 
          : 'app_284beb8f90_rainbow_requests';
        
        console.log('🔄 Trying alternative table:', otherTable);
        
        const { data: secondData, error: secondError } = await supabase
          .from(otherTable)
          .delete()
          .eq('id', id)
          .select();
          
        if (secondError) {
          console.error('❌ Delete failed from both tables:', secondError);
          throw new Error(`ไม่สามารถลบข้อมูลได้: ${secondError.message}`);
        }
        
        // ตรวจสอบว่าข้อมูลถูกลบจริงหรือไม่
        if (!secondData || secondData.length === 0) {
          console.error('❌ No rows were deleted from alternative table');
          throw new Error('ไม่พบข้อมูลที่ต้องการลบ');
        }
        
        console.log('✅ Successfully deleted from alternative table:', otherTable, 'Rows deleted:', secondData.length);
      }
    } else {
      // ตรวจสอบว่าข้อมูลถูกลบจริงหรือไม่
      if (!data || data.length === 0) {
        console.error('❌ No rows were deleted from table:', tableName);
        throw new Error('ไม่พบข้อมูลที่ต้องการลบ');
      }
      
      console.log('✅ Successfully deleted from table:', tableName, 'Rows deleted:', data.length);
    }
    
    // ยืนยันว่าการลบสำเร็จแล้วค่อยอัพเดท UI
    console.log('✅ Database deletion successful, updating UI...');
    
    // Force immediate UI update by filtering out the deleted item
    setRequests(prevRequests => prevRequests.filter(req => req.id !== id));
    setRainbowRequests(prevRequests => prevRequests.filter(req => req.id !== id));
    
    console.log('✅ UI updated, request removed from display');
    toast.success('ลบคำขอสำเร็จ');
  } catch (error) {
    console.error('Delete error:', error);
    toast.error(`เกิดข้อผิดพลาดในการลบคำขอ: ${error.message}`);
  }
};
```

## 🚀 ข้อดีของการแก้ไขใหม่

1. **ไม่ต้องใช้ Edge Function** - ใช้ adminApi ที่มีอยู่แล้ว
2. **จัดการ RLS Policies** - ใช้ adminApi ที่มีสิทธิ์เต็ม
3. **ตรวจสอบการลบจริง** - ยืนยันว่าข้อมูลถูกลบจากฐานข้อมูล
4. **ไม่มีการอัพเดท UI ก่อนยืนยัน** - ป้องกันการแสดงผลผิดพลาด
5. **Fallback หลายชั้น** - ลองหลายวิธีในการลบข้อมูล

## 🧪 วิธีการทดสอบ

1. **ทดสอบปุ่มลบ**:
   - เปิด Developer Console (F12)
   - คลิกปุ่มลบในตารางคำขอ
   - ตรวจสอบ Console Log
   - รีเฟรชหน้าเพื่อยืนยันว่าข้อมูลหายไปจริง

2. **ตรวจสอบ adminApi**:
   - ดู logs ใน Supabase Dashboard
   - ตรวจสอบ Edge Function logs ของ admin_operations

## 📋 สิ่งที่ต้องตรวจสอบ

- [ ] ปุ่มลบทำงานเมื่อคลิก
- [ ] Confirm dialog แสดงขึ้นมา
- [ ] ข้อมูลถูกลบจากฐานข้อมูลจริง
- [ ] UI อัพเดททันที
- [ ] ข้อมูลไม่กลับมาหลังรีเฟรช
- [ ] Error message แสดงเมื่อเกิดปัญหา
- [ ] Console log แสดงการทำงาน

## 🔄 การ Rollback

หากต้องการย้อนกลับ:
```bash
# ย้อนกลับโค้ด Admin.tsx
git checkout HEAD~1 src/pages/Admin.tsx

# ย้อนกลับ adminApi.ts
git checkout HEAD~1 src/lib/adminApi.ts
```

## 📞 การติดต่อ

หากยังมีปัญหา กรุณาติดต่อพร้อมข้อมูล:
- Console log
- Error message
- ขั้นตอนการทำซ้ำ
- ข้อมูลคำขอที่พยายามลบ

