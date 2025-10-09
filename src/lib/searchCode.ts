import { supabase } from './supabase';

// ฟังก์ชันค้นหาโค้ด 100RLJHF210F ในทุกตาราง
export const searchCode100RLJHF210F = async () => {
  const searchCode = '100RLJHF210F';
  console.log(`🔍 ค้นหาโค้ด: ${searchCode} ในทุกตาราง...`);
  console.log('='.repeat(80));
  
  try {
    // 1. ค้นหาใน redemption_codes (Robux)
    console.log('\n📋 ตารางที่ 1: app_284beb8f90_redemption_codes');
    const { data: robuxCodes, error: robuxError } = await supabase
      .from('app_284beb8f90_redemption_codes')
      .select('*')
      .or(`code.ilike.%${searchCode}%`);
    
    if (robuxError) {
      console.error('❌ Error:', robuxError);
    } else if (robuxCodes && robuxCodes.length > 0) {
      console.log(`✅ พบ ${robuxCodes.length} รายการ:`);
      robuxCodes.forEach((item, i) => {
        console.log(`   ${i + 1}. Code: ${item.code}`);
        console.log(`      Status: ${item.status || item.is_used ? 'used' : 'available'}`);
        console.log(`      Robux: ${item.robux_value || 'N/A'}`);
        console.log(`      Created: ${item.created_at}`);
      });
    } else {
      console.log('❌ ไม่พบ');
    }

    // 2. ค้นหาใน redemption_requests
    console.log('\n📋 ตารางที่ 2: app_284beb8f90_redemption_requests');
    const { data: requests, error: requestError } = await supabase
      .from('app_284beb8f90_redemption_requests')
      .select('*')
      .or(`assigned_code.ilike.%${searchCode}%`);
    
    if (requestError) {
      console.error('❌ Error:', requestError);
    } else if (requests && requests.length > 0) {
      console.log(`✅ พบ ${requests.length} รายการ:`);
      requests.forEach((item, i) => {
        console.log(`   ${i + 1}. ID: ${item.id}`);
        console.log(`      Username: ${item.roblox_username}`);
        console.log(`      Code: ${item.assigned_code}`);
        console.log(`      Status: ${item.status}`);
        console.log(`      Contact: ${item.contact_info}`);
        console.log(`      Created: ${item.created_at}`);
      });
    } else {
      console.log('❌ ไม่พบ');
    }

    // 3. ค้นหาใน queue_items
    console.log('\n📋 ตารางที่ 3: queue_items');
    const { data: queueItems, error: queueError } = await supabase
      .from('queue_items')
      .select('*')
      .or(`assigned_code.ilike.%${searchCode}%,contact_info.ilike.%${searchCode}%`);
    
    if (queueError) {
      console.error('❌ Error:', queueError);
    } else if (queueItems && queueItems.length > 0) {
      console.log(`✅ พบ ${queueItems.length} รายการ:`);
      queueItems.forEach((item, i) => {
        console.log(`   ${i + 1}. Queue #${item.queue_number}`);
        console.log(`      Username: ${item.roblox_username || 'N/A'}`);
        console.log(`      Code: ${item.assigned_code || 'N/A'}`);
        console.log(`      Status: ${item.status}`);
        console.log(`      Created: ${item.created_at}`);
      });
    } else {
      console.log('❌ ไม่พบ');
    }

    // 4. ค้นหาใน chicken_accounts
    console.log('\n📋 ตารางที่ 4: app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_chicken_accounts');
    const { data: chickenAccounts, error: chickenError } = await supabase
      .from('app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_chicken_accounts')
      .select('*')
      .or(`code.ilike.%${searchCode}%`);
    
    if (chickenError) {
      console.error('❌ Error:', chickenError);
    } else if (chickenAccounts && chickenAccounts.length > 0) {
      console.log(`✅ พบ ${chickenAccounts.length} รายการ:`);
      chickenAccounts.forEach((item, i) => {
        console.log(`   ${i + 1}. Code: ${item.code}`);
        console.log(`      Username: ${item.username}`);
        console.log(`      Status: ${item.status}`);
        console.log(`      Used by: ${item.used_by || 'N/A'}`);
        console.log(`      Created: ${item.created_at}`);
      });
    } else {
      console.log('❌ ไม่พบ');
    }

    // 5. ค้นหาใน redeem_codes (general)
    console.log('\n📋 ตารางที่ 5: app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_redeem_codes');
    const { data: redeemCodes, error: redeemError } = await supabase
      .from('app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_redeem_codes')
      .select('*')
      .or(`code.ilike.%${searchCode}%`);
    
    if (redeemError) {
      console.error('❌ Error:', redeemError);
    } else if (redeemCodes && redeemCodes.length > 0) {
      console.log(`✅ พบ ${redeemCodes.length} รายการ:`);
      redeemCodes.forEach((item, i) => {
        console.log(`   ${i + 1}. Code: ${item.code}`);
        console.log(`      Username: ${item.username || 'N/A'}`);
        console.log(`      Password: ${item.password || 'N/A'}`);
        console.log(`      Used: ${item.is_used ? 'Yes' : 'No'}`);
        console.log(`      Created: ${item.created_at}`);
      });
    } else {
      console.log('❌ ไม่พบ');
    }

    // 6. ค้นหาใน rainbow_six_redeem_codes
    console.log('\n📋 ตารางที่ 6: rainbow_six_redeem_codes');
    const { data: rainbowCodes, error: rainbowError } = await supabase
      .from('rainbow_six_redeem_codes')
      .select('*')
      .or(`code.ilike.%${searchCode}%,game_code.ilike.%${searchCode}%`);
    
    if (rainbowError) {
      console.error('❌ Error:', rainbowError);
    } else if (rainbowCodes && rainbowCodes.length > 0) {
      console.log(`✅ พบ ${rainbowCodes.length} รายการ:`);
      rainbowCodes.forEach((item, i) => {
        console.log(`   ${i + 1}. Code: ${item.code}`);
        console.log(`      Game Code: ${item.game_code}`);
        console.log(`      Used: ${item.is_used ? 'Yes' : 'No'}`);
        console.log(`      Created: ${item.created_at}`);
      });
    } else {
      console.log('❌ ไม่พบ');
    }

    console.log('\n' + '='.repeat(80));
    console.log('🎯 สรุป: ตรวจสอบ 6 ตารางเสร็จสิ้น');
    
  } catch (error) {
    console.error('❌ Error in searchCode100RLJHF210F:', error);
  }
};

// Export เพื่อใช้งานใน console
if (typeof window !== 'undefined') {
  (window as any).searchCode100RLJHF210F = searchCode100RLJHF210F;
}

