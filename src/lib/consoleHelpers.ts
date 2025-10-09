import { showCustomerData, searchCustomerData, analyzeDataPatterns } from './showCustomerData';
import { showSearchableNames, searchSpecificName } from './showSearchableNames';
import { debugTammamConol78, findSimilarNames } from './debugTammamConol78';
import { searchCode100RLJHF210F } from './searchCode';

// ฟังก์ชันสำหรับเรียกใช้ใน console
export const setupConsoleHelpers = () => {
  // เพิ่มฟังก์ชันลงใน window object เพื่อเรียกใช้ใน console
  (window as any).showCustomerData = showCustomerData;
  (window as any).searchCustomerData = searchCustomerData;
  (window as any).analyzeDataPatterns = analyzeDataPatterns;
  (window as any).showSearchableNames = showSearchableNames;
  (window as any).searchSpecificName = searchSpecificName;
  (window as any).debugTammamConol78 = debugTammamConol78;
  (window as any).findSimilarNames = findSimilarNames;
  (window as any).searchCode100RLJHF210F = searchCode100RLJHF210F;
  
  console.log('🔧 Console helpers loaded!');
  console.log('📋 Available functions:');
  console.log('   - showCustomerData() - แสดงข้อมูล customer_name และ contact_info');
  console.log('   - searchCustomerData("searchTerm") - ค้นหาข้อมูลเฉพาะ');
  console.log('   - analyzeDataPatterns() - วิเคราะห์รูปแบบข้อมูล');
  console.log('   - showSearchableNames() - แสดงชื่อที่ใช้ค้นหาได้');
  console.log('   - searchSpecificName("searchTerm") - ค้นหาชื่อเฉพาะ');
  console.log('   - debugTammamConol78() - ตรวจสอบข้อมูล TammamConol78');
  console.log('   - findSimilarNames() - ค้นหาชื่อที่คล้ายกัน');
  console.log('   - searchCode100RLJHF210F() - ค้นหาโค้ด 100RLJHF210F ในทุกตาราง');
  console.log('');
  console.log('💡 Example usage:');
  console.log('   showCustomerData()');
  console.log('   searchCustomerData("JarnBanG")');
  console.log('   analyzeDataPatterns()');
  console.log('   debugTammamConol78()');
  console.log('   findSimilarNames()');
  console.log('   searchCode100RLJHF210F()');
};

// เรียกใช้ทันทีเมื่อ import
setupConsoleHelpers();
