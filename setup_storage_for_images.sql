-- สร้าง Storage Bucket สำหรับเก็บรูปภาพที่ลูกค้าอัพโหลด
-- ใน Supabase Storage

-- 1. สร้าง bucket ชื่อ 'queue-attachments' (ทำใน Supabase Dashboard)
-- ไปที่: Storage → Create bucket
-- ชื่อ: queue-attachments
-- Public: เปิด (เพื่อให้แอดมินดูรูปได้)

-- 2. ตั้งค่า Policy สำหรับ bucket
-- Allow public read
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'queue-attachments' );

-- Allow authenticated upload
CREATE POLICY "Allow Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'queue-attachments' );

-- Allow delete own files
CREATE POLICY "Allow Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'queue-attachments' );

-- 3. หมายเหตุ:
-- - รูปภาพจะถูกเก็บใน folder: game-history/
-- - ตัวอย่าง path: game-history/[queue_id]_[timestamp].jpg
-- - URL format: https://[project-id].supabase.co/storage/v1/object/public/queue-attachments/game-history/xxxxx.jpg

COMMIT;




