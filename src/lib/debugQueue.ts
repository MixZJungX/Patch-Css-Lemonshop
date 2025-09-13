import { supabase } from './supabase';

// ฟังก์ชันสำหรับ debug ข้อมูลคิว
export const debugQueueData = async () => {
  console.log('🔍 เริ่มต้น debug ข้อมูลคิว...');
  
  try {
    // 1. ตรวจสอบข้อมูลใน queue_items
    const { data: queueData, error: queueError } = await supabase
      .from('queue_items')
      .select('*')
      .limit(10);
    
    if (queueError) {
      console.error('❌ Error loading queue_items:', queueError);
    } else {
      console.log('📊 ข้อมูลใน queue_items:', queueData?.length || 0, 'รายการ');
      if (queueData && queueData.length > 0) {
        console.log('📋 ตัวอย่างข้อมูล queue_items:', queueData.map(item => ({
          id: item.id,
          queue_number: item.queue_number,
          roblox_username: item.roblox_username,
          contact_info: item.contact_info,
          status: item.status,
          created_at: item.created_at
        })));
      }
    }
    
    // 2. ตรวจสอบข้อมูลใน redemption_requests
    const { data: redemptionData, error: redemptionError } = await supabase
      .from('app_284beb8f90_redemption_requests')
      .select('*')
      .limit(10);
    
    if (redemptionError) {
      console.error('❌ Error loading redemption_requests:', redemptionError);
    } else {
      console.log('📊 ข้อมูลใน redemption_requests:', redemptionData?.length || 0, 'รายการ');
      if (redemptionData && redemptionData.length > 0) {
        console.log('📋 ตัวอย่างข้อมูล redemption_requests:', redemptionData.map(item => ({
          id: item.id,
          roblox_username: item.roblox_username,
          contact_info: item.contact_info,
          status: item.status,
          created_at: item.created_at
        })));
      }
    }
    
    // 3. ทดสอบการค้นหา "JarnBanG"
    console.log('🔍 ทดสอบการค้นหา "JarnBanG"...');
    
    // ค้นหาใน queue_items (ใช้ฟิลด์ที่มีอยู่จริง)
    const { data: searchQueueData, error: searchQueueError } = await supabase
      .from('queue_items')
      .select('*')
      .or(`contact_info.ilike.%jarnbang%`);
    
    if (searchQueueError) {
      console.error('❌ Error searching in queue_items:', searchQueueError);
    } else {
      console.log('🔍 ผลการค้นหาใน queue_items:', searchQueueData?.length || 0, 'รายการ');
      if (searchQueueData && searchQueueData.length > 0) {
        console.log('📋 ผลลัพธ์:', searchQueueData);
      }
    }
    
    // ค้นหาใน redemption_requests
    const { data: searchRedemptionData, error: searchRedemptionError } = await supabase
      .from('app_284beb8f90_redemption_requests')
      .select('*')
      .or(`roblox_username.ilike.%jarnbang%,contact_info.ilike.%jarnbang%`);
    
    if (searchRedemptionError) {
      console.error('❌ Error searching in redemption_requests:', searchRedemptionError);
    } else {
      console.log('🔍 ผลการค้นหาใน redemption_requests:', searchRedemptionData?.length || 0, 'รายการ');
      if (searchRedemptionData && searchRedemptionData.length > 0) {
        console.log('📋 ผลลัพธ์:', searchRedemptionData);
      }
    }
    
    // 4. แสดงข้อมูลทั้งหมดที่มี "JarnBanG" ในรูปแบบต่างๆ
    console.log('🔍 ค้นหาทุกรูปแบบของ "JarnBanG"...');
    
    const allSearchTerms = ['jarnbang', 'JarnBanG', 'JARNBANG', 'JarnBang'];
    
    for (const term of allSearchTerms) {
      const { data: allQueueData, error: allQueueError } = await supabase
        .from('queue_items')
        .select('*')
        .or(`contact_info.ilike.%${term}%`);
      
      if (!allQueueError && allQueueData && allQueueData.length > 0) {
        console.log(`✅ พบใน queue_items ด้วย "${term}":`, allQueueData);
      }
      
      const { data: allRedemptionData, error: allRedemptionError } = await supabase
        .from('app_284beb8f90_redemption_requests')
        .select('*')
        .or(`roblox_username.ilike.%${term}%,contact_info.ilike.%${term}%`);
      
      if (!allRedemptionError && allRedemptionData && allRedemptionData.length > 0) {
        console.log(`✅ พบใน redemption_requests ด้วย "${term}":`, allRedemptionData);
      }
    }
    
  } catch (error) {
    console.error('❌ Error in debugQueueData:', error);
  }
};

// ฟังก์ชันสำหรับทดสอบการค้นหาแบบละเอียด
export const testSearchFunction = async (searchTerm: string) => {
  console.log(`🔍 ทดสอบการค้นหา "${searchTerm}"...`);
  
  const searchLower = searchTerm.toLowerCase().trim();
  
    // ทดสอบการค้นหาใน queue_items (ใช้ฟิลด์ที่มีอยู่จริง)
    const { data: queueData, error: queueError } = await supabase
      .from('queue_items')
      .select('*')
      .or(`contact_info.ilike.%${searchLower}%,assigned_code.ilike.%${searchLower}%`);
  
  if (queueError) {
    console.error('❌ Error searching queue_items:', queueError);
    return [];
  }
  
  console.log('📊 ผลการค้นหาใน queue_items:', queueData?.length || 0, 'รายการ');
  
  // ทดสอบการค้นหาใน redemption_requests
  const { data: redemptionData, error: redemptionError } = await supabase
    .from('app_284beb8f90_redemption_requests')
    .select('*')
    .or(`roblox_username.ilike.%${searchLower}%,contact_info.ilike.%${searchLower}%,assigned_code.ilike.%${searchLower}%`);
  
  if (redemptionError) {
    console.error('❌ Error searching redemption_requests:', redemptionError);
  } else {
    console.log('📊 ผลการค้นหาใน redemption_requests:', redemptionData?.length || 0, 'รายการ');
  }
  
  return [...(queueData || []), ...(redemptionData || [])];
};
