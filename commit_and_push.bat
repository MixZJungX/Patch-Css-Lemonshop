@echo off
echo ========================================
echo 🎨 Committing iOS Premium UI Changes
echo ========================================
echo.

echo 📂 Adding files...
git add src/components/ui/dialog.tsx src/pages/Home.tsx

echo.
echo 💾 Committing changes...
git commit -m "🎨 ปรับ UI Dialog ให้โค้งมนแบบ iOS Premium - เปลี่ยน dialog เป็น rounded-[2.5rem] (40px) - ปรับปุ่มปิดเป็นวงกลม rounded-full พร้อม hover effects - เพิ่ม scale animation และ backdrop blur - ปรับ Robux badge เป็น pill shape"

echo.
echo 🚀 Pushing to GitHub...
git push origin main

echo.
echo ✅ Done!
echo ========================================
pause

