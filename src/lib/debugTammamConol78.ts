import { supabase } from './supabase';

// ฟังก์ชันตรวจสอบข้อมูล TammamConol78
export const debugTammamConol78 = async () => {
  console.log('🔍 ตรวจสอบข้อมูล TammamConol78...');
  
  try {
    // 1. ตรวจสอบข้อมูลทั้งหมดใน queue_items
    console.log('📊 ตรวจสอบข้อมูลทั้งหมดใน queue_items...');
    const { data: allData, error: allError } = await supabase
      .from('queue_items')
      .select('*')
      .limit(10);
    
    if (allError) {
      console.error('❌ Error loading all data:', allError);
    } else {
      console.log('✅ ข้อมูลทั้งหมด:', allData?.length || 0, 'รายการ');
      if (allData && allData.length > 0) {
        console.log('📋 ตัวอย่างข้อมูล:');
        allData.forEach((item, index) => {
          console.log(`${index + 1}. คิว #${item.queue_number}`);
          console.log(`   - roblox_username: "${item.roblox_username || 'ไม่มี'}"`);
          console.log(`   - customer_name: "${item.customer_name || 'ไม่มี'}"`);
          console.log(`   - contact_info: "${item.contact_info || 'ไม่มี'}"`);
          console.log(`   - assigned_code: "${item.assigned_code || 'ไม่มี'}"`);
          console.log('---');
        });
      }
    }
    
    // 2. ค้นหา TammamConol78 ในรูปแบบต่างๆ
    const searchTerms = [
      'TammamConol78',
      'tammamconol78',
      'TAMMAMCONOL78',
      'TammamConol',
      'tammamconol'
    ];
    
    console.log('\n🔍 ค้นหา TammamConol78 ในรูปแบบต่างๆ...');
    
    for (const term of searchTerms) {
      console.log(`\n🔎 ค้นหา: "${term}"`);
      
      // ค้นหาใน roblox_username
      const { data: usernameData, error: usernameError } = await supabase
        .from('queue_items')
        .select('*')
        .ilike('roblox_username', `%${term}%`);
      
      if (!usernameError && usernameData && usernameData.length > 0) {
        console.log(`✅ พบใน roblox_username: ${usernameData.length} รายการ`);
        usernameData.forEach((item, index) => {
          console.log(`   ${index + 1}. คิว #${item.queue_number} - ${item.roblox_username}`);
        });
      } else {
        console.log(`❌ ไม่พบใน roblox_username`);
      }
      
      // ค้นหาใน customer_name
      const { data: customerData, error: customerError } = await supabase
        .from('queue_items')
        .select('*')
        .ilike('customer_name', `%${term}%`);
      
      if (!customerError && customerData && customerData.length > 0) {
        console.log(`✅ พบใน customer_name: ${customerData.length} รายการ`);
        customerData.forEach((item, index) => {
          console.log(`   ${index + 1}. คิว #${item.queue_number} - ${item.customer_name}`);
        });
      } else {
        console.log(`❌ ไม่พบใน customer_name`);
      }
      
      // ค้นหาใน contact_info
      const { data: contactData, error: contactError } = await supabase
        .from('queue_items')
        .select('*')
        .ilike('contact_info', `%${term}%`);
      
      if (!contactError && contactData && contactData.length > 0) {
        console.log(`✅ พบใน contact_info: ${contactData.length} รายการ`);
        contactData.forEach((item, index) => {
          console.log(`   ${index + 1}. คิว #${item.queue_number}`);
          console.log(`      Contact: ${item.contact_info}`);
        });
      } else {
        console.log(`❌ ไม่พบใน contact_info`);
      }
      
      // ค้นหาใน assigned_code
      const { data: codeData, error: codeError } = await supabase
        .from('queue_items')
        .select('*')
        .ilike('assigned_code', `%${term}%`);
      
      if (!codeError && codeData && codeData.length > 0) {
        console.log(`✅ พบใน assigned_code: ${codeData.length} รายการ`);
        codeData.forEach((item, index) => {
          console.log(`   ${index + 1}. คิว #${item.queue_number} - ${item.assigned_code}`);
        });
      } else {
        console.log(`❌ ไม่พบใน assigned_code`);
      }
    }
    
    // 3. ตรวจสอบใน redemption_requests
    console.log('\n🔍 ตรวจสอบใน redemption_requests...');
    const { data: redemptionData, error: redemptionError } = await supabase
      .from('app_284beb8f90_redemption_requests')
      .select('*')
      .ilike('roblox_username', '%TammamConol78%');
    
    if (!redemptionError && redemptionData && redemptionData.length > 0) {
      console.log(`✅ พบใน redemption_requests: ${redemptionData.length} รายการ`);
      redemptionData.forEach((item, index) => {
        console.log(`${index + 1}. ID: ${item.id}`);
        console.log(`   - Username: ${item.roblox_username}`);
        console.log(`   - Contact: ${item.contact_info}`);
        console.log(`   - Status: ${item.status}`);
        console.log(`   - Code: ${item.assigned_code || 'ไม่มี'}`);
      });
    } else {
      console.log(`❌ ไม่พบใน redemption_requests`);
    }
    
    // 4. แสดงสรุป
    console.log('\n📊 สรุป:');
    console.log('='.repeat(50));
    console.log('🔍 การค้นหา "TammamConol78" ไม่พบใน:');
    console.log('   - queue_items (roblox_username)');
    console.log('   - queue_items (customer_name)');
    console.log('   - queue_items (contact_info)');
    console.log('   - queue_items (assigned_code)');
    console.log('   - redemption_requests');
    console.log('\n💡 สาเหตุที่เป็นไปได้:');
    console.log('   1. ชื่ออาจสะกดผิด');
    console.log('   2. ข้อมูลอาจอยู่ในตารางอื่น');
    console.log('   3. ข้อมูลอาจถูกลบไปแล้ว');
    console.log('   4. ชื่ออาจแตกต่างจากที่ค้นหา');
    
  } catch (error) {
    console.error('❌ Error in debugTammamConol78:', error);
  }
};

// ฟังก์ชันค้นหาชื่อที่คล้ายกัน
export const findSimilarNames = async () => {
  console.log('🔍 ค้นหาชื่อที่คล้ายกับ TammamConol78...');
  
  try {
    // ค้นหาชื่อที่ขึ้นต้นด้วย Tammam
    const { data: tammamData, error: tammamError } = await supabase
      .from('queue_items')
      .select('*')
      .ilike('roblox_username', 'Tammam%');
    
    if (!tammamError && tammamData && tammamData.length > 0) {
      console.log(`✅ พบชื่อที่ขึ้นต้นด้วย "Tammam": ${tammamData.length} รายการ`);
      tammamData.forEach((item, index) => {
        console.log(`${index + 1}. คิว #${item.queue_number} - ${item.roblox_username}`);
      });
    } else {
      console.log(`❌ ไม่พบชื่อที่ขึ้นต้นด้วย "Tammam"`);
    }
    
    // ค้นหาชื่อที่มี Conol
    const { data: conolData, error: conolError } = await supabase
      .from('queue_items')
      .select('*')
      .ilike('roblox_username', '%Conol%');
    
    if (!conolError && conolData && conolData.length > 0) {
      console.log(`✅ พบชื่อที่มี "Conol": ${conolData.length} รายการ`);
      conolData.forEach((item, index) => {
        console.log(`${index + 1}. คิว #${item.queue_number} - ${item.roblox_username}`);
      });
    } else {
      console.log(`❌ ไม่พบชื่อที่มี "Conol"`);
    }
    
    // ค้นหาชื่อที่มี 78
    const { data: number78Data, error: number78Error } = await supabase
      .from('queue_items')
      .select('*')
      .ilike('roblox_username', '%78%');
    
    if (!number78Error && number78Data && number78Data.length > 0) {
      console.log(`✅ พบชื่อที่มี "78": ${number78Data.length} รายการ`);
      number78Data.forEach((item, index) => {
        console.log(`${index + 1}. คิว #${item.queue_number} - ${item.roblox_username}`);
      });
    } else {
      console.log(`❌ ไม่พบชื่อที่มี "78"`);
    }
    
  } catch (error) {
    console.error('❌ Error in findSimilarNames:', error);
  }
};















