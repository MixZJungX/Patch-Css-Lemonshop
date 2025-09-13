import { supabase } from './supabase';

// ฟังก์ชันทดสอบการค้นหาแบบง่ายๆ
export const testSimpleSearch = async (searchTerm: string) => {
  console.log(`🔍 ทดสอบการค้นหาแบบง่าย "${searchTerm}"...`);
  
  const searchLower = searchTerm.toLowerCase().trim();
  
  try {
    // ค้นหาใน redemption_requests แบบ exact match
    const { data: redemptionData, error: redemptionError } = await supabase
      .from('app_284beb8f90_redemption_requests')
      .select('*')
      .or(`roblox_username.ilike.${searchLower},contact_info.ilike.${searchLower}`);
    
    if (redemptionError) {
      console.error('❌ Error searching redemption_requests:', redemptionError);
      return [];
    }
    
    console.log('📊 ผลการค้นหาใน redemption_requests:', redemptionData?.length || 0, 'รายการ');
    
    if (redemptionData && redemptionData.length > 0) {
      console.log('✅ พบข้อมูล! รายละเอียด:');
      redemptionData.forEach((item, index) => {
        console.log(`${index + 1}. ID: ${item.id}`);
        console.log(`   - Username: ${item.roblox_username}`);
        console.log(`   - Contact: ${item.contact_info}`);
        console.log(`   - Status: ${item.status}`);
        console.log(`   - Code: ${item.assigned_code || 'ไม่ระบุ'}`);
        console.log(`   - Created: ${item.created_at}`);
        console.log('---');
      });
      
      // หาหมายเลขคิวที่เกี่ยวข้องจาก queue_items
      const queueItems = await Promise.all(redemptionData.map(async (redemption) => {
        // ค้นหา queue_items ที่มี contact_info ตรงกับ redemption
        const { data: queueData, error: queueError } = await supabase
          .from('queue_items')
          .select('queue_number, id')
          .or(`contact_info.ilike.%${redemption.roblox_username}%`)
          .limit(1);
        
        let queueNumber = 0;
        let queueId = redemption.id;
        
        if (!queueError && queueData && queueData.length > 0) {
          queueNumber = queueData[0].queue_number;
          queueId = queueData[0].id;
        }
        
        // แปลง status จาก redemption_requests เป็น queue status
        let queueStatus: 'waiting' | 'processing' | 'completed' | 'cancelled' | 'problem' = 'waiting';
        switch (redemption.status) {
          case 'pending':
            queueStatus = 'waiting';
            break;
          case 'processing':
            queueStatus = 'processing';
            break;
          case 'completed':
            queueStatus = 'completed';
            break;
          case 'rejected':
            queueStatus = 'cancelled';
            break;
          default:
            queueStatus = 'waiting';
        }
        
        return {
          id: queueId,
          queue_number: queueNumber,
          contact_info: redemption.contact_info,
          product_type: 'robux' as const,
          status: queueStatus,
          roblox_username: redemption.roblox_username,
          roblox_password: redemption.roblox_password,
          robux_amount: redemption.robux_amount,
          assigned_code: redemption.assigned_code,
          assigned_account_code: redemption.assigned_account_code,
          code_id: redemption.code_id,
          created_at: redemption.created_at,
          updated_at: redemption.updated_at
        };
      }));
      
      return queueItems;
    }
    
    return [];
    
  } catch (error) {
    console.error('❌ Error in testSimpleSearch:', error);
    return [];
  }
};

// ฟังก์ชันแสดงข้อมูล redemption_requests ที่มี "JarnBanG"
export const showJarnBanGData = async () => {
  console.log('🔍 แสดงข้อมูล "JarnBanG" ใน redemption_requests...');
  
  try {
    const { data, error } = await supabase
      .from('app_284beb8f90_redemption_requests')
      .select('*')
      .or(`roblox_username.ilike.%jarnbang%,contact_info.ilike.%jarnbang%`);
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ พบข้อมูล "JarnBanG":');
      data.forEach((item, index) => {
        console.log(`\n📋 รายการที่ ${index + 1}:`);
        console.log(`   🆔 ID: ${item.id}`);
        console.log(`   👤 Username: ${item.roblox_username}`);
        console.log(`   📱 Contact: ${item.contact_info}`);
        console.log(`   🎫 Code: ${item.assigned_code || 'ไม่ระบุ'}`);
        console.log(`   🔑 Account Code: ${item.assigned_account_code || 'ไม่ระบุ'}`);
        console.log(`   💎 Robux: ${item.robux_amount || 'ไม่ระบุ'}`);
        console.log(`   📊 Status: ${item.status}`);
        console.log(`   📅 Created: ${new Date(item.created_at).toLocaleString('th-TH')}`);
        console.log(`   🔄 Updated: ${new Date(item.updated_at).toLocaleString('th-TH')}`);
      });
    } else {
      console.log('❌ ไม่พบข้อมูล "JarnBanG"');
    }
    
  } catch (error) {
    console.error('❌ Error in showJarnBanGData:', error);
  }
};

