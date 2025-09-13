import { supabase } from './supabase';

// ฟังก์ชันหาหมายเลขคิวจาก redemption request
export const findQueueNumberForRedemption = async (redemptionData: any) => {
  console.log('🔍 หาหมายเลขคิวสำหรับ redemption:', redemptionData.roblox_username);
  
  try {
    // วิธีที่ 1: ค้นหาจาก contact_info ที่มี username แบบ exact match
    const { data: queueData1, error: error1 } = await supabase
      .from('queue_items')
      .select('queue_number, id, contact_info')
      .or(`contact_info.ilike.${redemptionData.roblox_username}`)
      .limit(5);
    
    if (!error1 && queueData1 && queueData1.length > 0) {
      console.log('✅ พบหมายเลขคิวจาก contact_info:', queueData1);
      return queueData1[0]; // เอาตัวแรก
    }
    
    // วิธีที่ 2: ค้นหาจากเบอร์โทร
    const phoneMatch = redemptionData.contact_info.match(/Phone:\s*([^|]+)/)?.[1]?.trim() ||
                      redemptionData.contact_info.match(/(\d{10,})/)?.[1];
    
    if (phoneMatch) {
      const { data: queueData2, error: error2 } = await supabase
        .from('queue_items')
        .select('queue_number, id, contact_info')
        .or(`contact_info.ilike.${phoneMatch}`)
        .limit(5);
      
      if (!error2 && queueData2 && queueData2.length > 0) {
        console.log('✅ พบหมายเลขคิวจากเบอร์โทร:', queueData2);
        return queueData2[0];
      }
    }
    
    // วิธีที่ 3: ค้นหาจาก Code
    const codeMatch = redemptionData.contact_info.match(/Code:\s*([^|]+)/)?.[1]?.trim();
    
    if (codeMatch) {
      const { data: queueData3, error: error3 } = await supabase
        .from('queue_items')
        .select('queue_number, id, contact_info')
        .or(`contact_info.ilike.${codeMatch}`)
        .limit(5);
      
      if (!error3 && queueData3 && queueData3.length > 0) {
        console.log('✅ พบหมายเลขคิวจาก Code:', queueData3);
        return queueData3[0];
      }
    }
    
    // วิธีที่ 4: ค้นหาจาก assigned_code
    if (redemptionData.assigned_code) {
      const { data: queueData4, error: error4 } = await supabase
        .from('queue_items')
        .select('queue_number, id, contact_info')
        .or(`assigned_code.ilike.${redemptionData.assigned_code}`)
        .limit(5);
      
      if (!error4 && queueData4 && queueData4.length > 0) {
        console.log('✅ พบหมายเลขคิวจาก assigned_code:', queueData4);
        return queueData4[0];
      }
    }
    
    console.log('❌ ไม่พบหมายเลขคิวที่เกี่ยวข้อง');
    return null;
    
  } catch (error) {
    console.error('❌ Error in findQueueNumberForRedemption:', error);
    return null;
  }
};

// ฟังก์ชันแสดงข้อมูลคิวทั้งหมดที่มี "JarnBanG"
export const showAllJarnBanGQueues = async () => {
  console.log('🔍 แสดงข้อมูลคิวทั้งหมดที่มี "JarnBanG"...');
  
  try {
    // ค้นหาใน queue_items
    const { data: queueData, error: queueError } = await supabase
      .from('queue_items')
      .select('*')
      .or(`contact_info.ilike.%jarnbang%`);
    
    if (queueError) {
      console.error('❌ Error searching queue_items:', queueError);
    } else {
      console.log('📊 ข้อมูลใน queue_items:', queueData?.length || 0, 'รายการ');
      if (queueData && queueData.length > 0) {
        console.log('📋 รายการคิว:');
        queueData.forEach((item, index) => {
          console.log(`${index + 1}. Queue #${item.queue_number}`);
          console.log(`   - Contact: ${item.contact_info}`);
          console.log(`   - Status: ${item.status}`);
          console.log(`   - Created: ${item.created_at}`);
          console.log('---');
        });
      }
    }
    
    // ค้นหาใน redemption_requests
    const { data: redemptionData, error: redemptionError } = await supabase
      .from('app_284beb8f90_redemption_requests')
      .select('*')
      .or(`roblox_username.ilike.%jarnbang%,contact_info.ilike.%jarnbang%`);
    
    if (redemptionError) {
      console.error('❌ Error searching redemption_requests:', redemptionError);
    } else {
      console.log('📊 ข้อมูลใน redemption_requests:', redemptionData?.length || 0, 'รายการ');
      if (redemptionData && redemptionData.length > 0) {
        console.log('📋 รายการ redemption:');
        redemptionData.forEach((item, index) => {
          console.log(`${index + 1}. ID: ${item.id}`);
          console.log(`   - Username: ${item.roblox_username}`);
          console.log(`   - Contact: ${item.contact_info}`);
          console.log(`   - Status: ${item.status}`);
          console.log(`   - Created: ${item.created_at}`);
          console.log('---');
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error in showAllJarnBanGQueues:', error);
  }
};
