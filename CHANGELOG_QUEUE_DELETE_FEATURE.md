# 🗑️ เพิ่มระบบลบคิวใน QueueManager

## 📅 วันที่อัปเดต
**วันที่**: 2025-01-27  
**เวอร์ชัน**: v1.1.0  
**ผู้พัฒนา**: AI Assistant  

## 🎯 สรุปการเปลี่ยนแปลง

เพิ่มระบบลบคิวใน QueueManager เพื่อให้แอดมินสามารถลบคิวที่ไม่ต้องการได้ผ่าน UI แทนการลบผ่าน SQL โดยตรง

## ✨ ฟีเจอร์ใหม่

### 🗑️ **ระบบลบคิว**
- **ปุ่มลบคิว**: เพิ่มปุ่มสีแดง "ลบ" ข้างปุ่ม "แก้ไข" ในตารางคิว
- **Confirmation Dialog**: หน้าต่างยืนยันการลบที่แสดงข้อมูลคิวที่จะลบ
- **Loading State**: แสดงสถานะ "กำลังลบ..." ขณะประมวลผล
- **Error Handling**: จัดการข้อผิดพลาดและแสดง toast notification

### 🎨 **UI/UX Improvements**
- ปุ่มลบสีแดงเข้ากับธีม
- Dialog สีแดงเพื่อเตือนความสำคัญ
- Loading spinner ขณะประมวลผล
- Responsive design

## 🔧 การเปลี่ยนแปลงในโค้ด

### 📁 **ไฟล์ที่แก้ไข**

#### `src/components/QueueManager.tsx`
```typescript
// เพิ่ม imports
import { deleteQueueItem } from '@/lib/queueApi';
import { Trash2 } from 'lucide-react';

// เพิ่ม state สำหรับ delete dialog
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [itemToDelete, setItemToDelete] = useState<QueueItem | null>(null);
const [deleting, setDeleting] = useState(false);

// เพิ่มฟังก์ชันจัดการการลบ
const handleDeleteQueue = (item: QueueItem) => {
  setItemToDelete(item);
  setDeleteDialogOpen(true);
};

const confirmDelete = async () => {
  if (!itemToDelete) return;
  
  setDeleting(true);
  try {
    await deleteQueueItem(itemToDelete.id);
    toast.success(`ลบคิว #${itemToDelete.queue_number} สำเร็จ`);
    setDeleteDialogOpen(false);
    setItemToDelete(null);
    loadQueueItems(); // รีเฟรชข้อมูล
  } catch (error) {
    console.error('Error deleting queue item:', error);
    toast.error('ไม่สามารถลบคิวได้');
  } finally {
    setDeleting(false);
  }
};

// เพิ่มปุ่มลบในตาราง
<Button
  onClick={() => handleDeleteQueue(item)}
  size="sm"
  variant="outline"
  className="text-white border-red-400/50 hover:bg-red-500/20 hover:border-red-400 transition-all duration-200 px-3"
>
  <Trash2 className="w-4 h-4 mr-1" />
  ลบ
</Button>

// เพิ่ม Delete Confirmation Dialog
<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
  <DialogContent className="bg-gray-900 border-red-500/30">
    <DialogHeader>
      <DialogTitle className="text-red-400 flex items-center gap-2">
        <Trash2 className="w-5 h-5" />
        ยืนยันการลบคิว
      </DialogTitle>
      <DialogDescription className="text-gray-300">
        คุณแน่ใจหรือไม่ที่จะลบคิว #{itemToDelete?.queue_number} ของ {itemToDelete?.roblox_username || itemToDelete?.customer_name || 'ไม่ระบุ'}?
        <br />
        <span className="text-red-400 font-semibold">การกระทำนี้ไม่สามารถย้อนกลับได้!</span>
      </DialogDescription>
    </DialogHeader>
    <DialogFooter className="gap-2">
      <Button onClick={cancelDelete} variant="outline" className="border-gray-500 text-gray-300 hover:bg-gray-700" disabled={deleting}>
        ยกเลิก
      </Button>
      <Button onClick={confirmDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
        {deleting ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            กำลังลบ...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            ลบคิว
          </div>
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## 🚀 วิธีการใช้งาน

### สำหรับแอดมิน:
1. เข้าสู่หน้า **Queue Manager**
2. หาคิวที่ต้องการลบในตาราง
3. กดปุ่ม **"ลบ"** (สีแดง) ข้างปุ่ม "แก้ไข"
4. ตรวจสอบข้อมูลในหน้าต่างยืนยัน
5. กด **"ลบคิว"** เพื่อยืนยัน หรือ **"ยกเลิก"** เพื่อยกเลิก
6. ระบบจะแสดงผลลัพธ์และรีเฟรชตารางอัตโนมัติ

## 🔒 ความปลอดภัย

- **Confirmation Dialog**: ป้องกันการลบโดยไม่ตั้งใจ
- **Error Handling**: จัดการข้อผิดพลาดอย่างเหมาะสม
- **Loading State**: ป้องกันการกดซ้ำขณะประมวลผล
- **Toast Notifications**: แจ้งผลลัพธ์ให้ผู้ใช้ทราบ

## 🧪 การทดสอบ

### ✅ **Test Cases ที่ผ่าน**
- [x] ลบคิวสำเร็จ
- [x] ยกเลิกการลบ
- [x] แสดง loading state
- [x] จัดการ error
- [x] รีเฟรชข้อมูลหลังลบ
- [x] แสดง toast notification

### 🎯 **การทดสอบที่แนะนำ**
1. ลบคิวที่สถานะต่างๆ (waiting, processing, completed, cancelled)
2. ลบคิวที่มีข้อมูลครบถ้วนและไม่ครบถ้วน
3. ทดสอบการยกเลิกการลบ
4. ทดสอบการลบขณะที่กำลังโหลดข้อมูล

## 📊 ผลกระทบ

### ✅ **ผลบวก**
- แอดมินสามารถลบคิวได้ง่ายขึ้น
- ไม่ต้องใช้ SQL โดยตรง
- UI/UX ที่ดีขึ้น
- ความปลอดภัยสูงขึ้น

### ⚠️ **ข้อควรระวัง**
- การลบคิวไม่สามารถย้อนกลับได้
- ควรตรวจสอบข้อมูลก่อนลบ
- ควรสำรองข้อมูลสำคัญ

## 🔄 การอัปเดตในอนาคต

### 🎯 **แผนการพัฒนาต่อ**
- [ ] เพิ่มการลบแบบ bulk (ลบหลายคิวพร้อมกัน)
- [ ] เพิ่มการลบแบบ soft delete (เก็บข้อมูลไว้แต่ซ่อน)
- [ ] เพิ่มการ export ข้อมูลก่อนลบ
- [ ] เพิ่มการ audit log สำหรับการลบ

## 📝 หมายเหตุ

- ฟีเจอร์นี้ใช้ฟังก์ชัน `deleteQueueItem` ที่มีอยู่แล้วใน `src/lib/queueApi.ts`
- ไม่มีการเปลี่ยนแปลงใน database schema
- ใช้ UI components ที่มีอยู่แล้ว (shadcn/ui)
- รองรับ responsive design

---

**🎉 ระบบลบคิวพร้อมใช้งานแล้ว!**  
แอดมินสามารถลบคิวได้ง่ายๆ ผ่าน UI แล้วครับ

