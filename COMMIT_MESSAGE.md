# 🗑️ เพิ่มระบบลบคิวใน QueueManager

## Commit Message
```
feat: เพิ่มระบบลบคิวใน QueueManager UI

- เพิ่มปุ่มลบคิวสีแดงข้างปุ่มแก้ไข
- เพิ่ม confirmation dialog สำหรับยืนยันการลบ
- เพิ่ม loading state และ error handling
- เพิ่ม toast notifications สำหรับผลลัพธ์
- รองรับ responsive design

Closes: #queue-delete-feature
```

## Files Changed
- `src/components/QueueManager.tsx` - เพิ่มระบบลบคิว UI

## Features Added
✅ ปุ่มลบคิวในตารางคิว  
✅ Confirmation dialog  
✅ Loading state  
✅ Error handling  
✅ Toast notifications  
✅ Responsive design  

## Testing
- [x] ลบคิวสำเร็จ
- [x] ยกเลิกการลบ  
- [x] แสดง loading state
- [x] จัดการ error
- [x] รีเฟรชข้อมูลหลังลบ

## Breaking Changes
None

## Migration Required
None

