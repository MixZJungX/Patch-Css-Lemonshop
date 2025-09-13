import { supabase } from './supabase';

// ฟังก์ชันทดสอบการเชื่อมต่อ Supabase
export const testSupabaseConnection = async () => {
  console.log('🔍 ทดสอบการเชื่อมต่อ Supabase...');
  
  try {
    // 1. ทดสอบการเชื่อมต่อพื้นฐาน
    console.log('1️⃣ ทดสอบการเชื่อมต่อพื้นฐาน...');
    const { data: testData, error: testError } = await supabase
      .from('queue_items')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error ในการเชื่อมต่อพื้นฐาน:', testError);
      return false;
    } else {
      console.log('✅ การเชื่อมต่อพื้นฐานสำเร็จ');
    }
    
    // 2. ทดสอบการดึงข้อมูลทั้งหมด
    console.log('2️⃣ ทดสอบการดึงข้อมูลทั้งหมด...');
    const { data: allData, error: allError } = await supabase
      .from('queue_items')
      .select('*')
      .limit(5);
    
    if (allError) {
      console.error('❌ Error ในการดึงข้อมูลทั้งหมด:', allError);
    } else {
      console.log('✅ การดึงข้อมูลทั้งหมดสำเร็จ:', allData?.length || 0, 'รายการ');
    }
    
    // 3. ทดสอบการค้นหาแบบง่าย
    console.log('3️⃣ ทดสอบการค้นหาแบบง่าย...');
    const { data: searchData, error: searchError } = await supabase
      .from('queue_items')
      .select('*')
      .eq('status', 'waiting')
      .limit(3);
    
    if (searchError) {
      console.error('❌ Error ในการค้นหา:', searchError);
    } else {
      console.log('✅ การค้นหาสำเร็จ:', searchData?.length || 0, 'รายการ');
    }
    
    // 4. ทดสอบการค้นหาแบบ ilike
    console.log('4️⃣ ทดสอบการค้นหาแบบ ilike...');
    const { data: ilikeData, error: ilikeError } = await supabase
      .from('queue_items')
      .select('*')
      .ilike('contact_info', '%test%')
      .limit(3);
    
    if (ilikeError) {
      console.error('❌ Error ในการค้นหาแบบ ilike:', ilikeError);
    } else {
      console.log('✅ การค้นหาแบบ ilike สำเร็จ:', ilikeData?.length || 0, 'รายการ');
    }
    
    // 5. ทดสอบการเข้าถึง redemption_requests
    console.log('5️⃣ ทดสอบการเข้าถึง redemption_requests...');
    const { data: redemptionData, error: redemptionError } = await supabase
      .from('app_284beb8f90_redemption_requests')
      .select('*')
      .limit(3);
    
    if (redemptionError) {
      console.error('❌ Error ในการเข้าถึง redemption_requests:', redemptionError);
    } else {
      console.log('✅ การเข้าถึง redemption_requests สำเร็จ:', redemptionData?.length || 0, 'รายการ');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error ใน testSupabaseConnection:', error);
    return false;
  }
};

// ฟังก์ชันทดสอบการแก้ไข Error 406
export const testFix406Error = async () => {
  console.log('🔧 ทดสอบการแก้ไข Error 406...');
  
  try {
    // ลองใช้ query ที่ง่ายกว่า
    const { data, error } = await supabase
      .from('queue_items')
      .select('id, queue_number, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Error 406 ยังคงมีอยู่:', error);
      return false;
    } else {
      console.log('✅ แก้ไข Error 406 สำเร็จ:', data?.length || 0, 'รายการ');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Error ใน testFix406Error:', error);
    return false;
  }
};

// ฟังก์ชันทดสอบการแก้ไข Error 400
export const testFix400Error = async () => {
  console.log('🔧 ทดสอบการแก้ไข Error 400...');
  
  try {
    // ลองใช้ query ที่ง่ายกว่า
    const { data, error } = await supabase
      .from('queue_items')
      .select('*')
      .ilike('contact_info', '%jarnbang%');
    
    if (error) {
      console.error('❌ Error 400 ยังคงมีอยู่:', error);
      return false;
    } else {
      console.log('✅ แก้ไข Error 400 สำเร็จ:', data?.length || 0, 'รายการ');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Error ใน testFix400Error:', error);
    return false;
  }
};

