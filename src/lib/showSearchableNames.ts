import { supabase } from './supabase';

// ฟังก์ชันแสดงชื่อที่ใช้ค้นหาได้ในตาราง queue_items
export const showSearchableNames = async () => {
  console.log('🔍 แสดงชื่อที่ใช้ค้นหาได้ในตาราง queue_items...');
  
  try {
    // ดึงข้อมูลทั้งหมดจาก queue_items
    const { data: queueData, error } = await supabase
      .from('queue_items')
      .select('queue_number, roblox_username, customer_name, contact_info, assigned_code')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('❌ Error loading queue data:', error);
      return;
    }
    
    if (!queueData || queueData.length === 0) {
      console.log('❌ ไม่พบข้อมูลในตาราง queue_items');
      return;
    }
    
    console.log('📊 ข้อมูลในตาราง queue_items:', queueData.length, 'รายการ');
    console.log('📋 ชื่อที่ใช้ค้นหาได้:');
    console.log('='.repeat(80));
    
    queueData.forEach((item, index) => {
      console.log(`\n${index + 1}. คิว #${item.queue_number}`);
      
      // แสดงชื่อจาก roblox_username
      if (item.roblox_username) {
        console.log(`   🎮 Roblox Username: "${item.roblox_username}"`);
      }
      
      // แสดงชื่อจาก customer_name
      if (item.customer_name) {
        console.log(`   👤 Customer Name: "${item.customer_name}"`);
      }
      
      // แสดงชื่อจาก contact_info
      if (item.contact_info) {
        const nameMatch = item.contact_info.match(/ชื่อ:\s*([^|]+)/)?.[1]?.trim();
        if (nameMatch) {
          console.log(`   📝 ชื่อใน Contact: "${nameMatch}"`);
        }
        
        const usernameMatch = item.contact_info.match(/Username:\s*([^|]+)/)?.[1]?.trim();
        if (usernameMatch) {
          console.log(`   🏷️ Username ใน Contact: "${usernameMatch}"`);
        }
      }
      
      // แสดงโค้ด
      if (item.assigned_code) {
        console.log(`   🎫 Assigned Code: "${item.assigned_code}"`);
      }
      
      // แสดงโค้ดจาก contact_info
      if (item.contact_info) {
        const codeMatch = item.contact_info.match(/Code:\s*([^|]+)/)?.[1]?.trim();
        if (codeMatch) {
          console.log(`   🔑 Code ใน Contact: "${codeMatch}"`);
        }
      }
      
      console.log('   ' + '-'.repeat(60));
    });
    
    // สรุปชื่อที่ใช้ค้นหาได้
    const searchableNames = new Set<string>();
    const searchableCodes = new Set<string>();
    
    queueData.forEach(item => {
      if (item.roblox_username) searchableNames.add(item.roblox_username);
      if (item.customer_name) searchableNames.add(item.customer_name);
      
      if (item.contact_info) {
        const nameMatch = item.contact_info.match(/ชื่อ:\s*([^|]+)/)?.[1]?.trim();
        if (nameMatch) searchableNames.add(nameMatch);
        
        const usernameMatch = item.contact_info.match(/Username:\s*([^|]+)/)?.[1]?.trim();
        if (usernameMatch) searchableNames.add(usernameMatch);
        
        const codeMatch = item.contact_info.match(/Code:\s*([^|]+)/)?.[1]?.trim();
        if (codeMatch) searchableCodes.add(codeMatch);
      }
      
      if (item.assigned_code) searchableCodes.add(item.assigned_code);
    });
    
    console.log('\n🎯 สรุปชื่อที่ใช้ค้นหาได้:');
    console.log('='.repeat(80));
    
    if (searchableNames.size > 0) {
      console.log('\n👤 ชื่อที่ใช้ค้นหาได้:');
      Array.from(searchableNames).forEach((name, index) => {
        console.log(`   ${index + 1}. "${name}"`);
      });
    }
    
    if (searchableCodes.size > 0) {
      console.log('\n🎫 โค้ดที่ใช้ค้นหาได้:');
      Array.from(searchableCodes).forEach((code, index) => {
        console.log(`   ${index + 1}. "${code}"`);
      });
    }
    
    console.log('\n💡 วิธีใช้:');
    console.log('   - ค้นหาด้วยหมายเลขคิว: 123');
    console.log('   - ค้นหาด้วยชื่อในเกม: PlayerName');
    console.log('   - ค้นหาด้วยโค้ด: 50BXJK258J');
    
  } catch (error) {
    console.error('❌ Error in showSearchableNames:', error);
  }
};

// ฟังก์ชันค้นหาชื่อเฉพาะ
export const searchSpecificName = async (searchTerm: string) => {
  console.log(`🔍 ค้นหาชื่อ "${searchTerm}" ในตาราง queue_items...`);
  
  const searchLower = searchTerm.toLowerCase().trim();
  
  try {
    const { data: queueData, error } = await supabase
      .from('queue_items')
      .select('*')
      .or(`queue_number.eq.${searchTerm},roblox_username.ilike.%${searchLower}%,contact_info.ilike.%${searchLower}%,assigned_code.ilike.%${searchLower}%,customer_name.ilike.%${searchLower}%`);
    
    if (error) {
      console.error('❌ Error searching:', error);
      return [];
    }
    
    if (!queueData || queueData.length === 0) {
      console.log(`❌ ไม่พบข้อมูลที่ตรงกับ "${searchTerm}"`);
      return [];
    }
    
    console.log(`✅ พบข้อมูล ${queueData.length} รายการ:`);
    queueData.forEach((item, index) => {
      console.log(`\n${index + 1}. คิว #${item.queue_number}`);
      console.log(`   - Status: ${item.status}`);
      console.log(`   - Product: ${item.product_type}`);
      console.log(`   - Username: ${item.roblox_username || 'ไม่ระบุ'}`);
      console.log(`   - Contact: ${item.contact_info}`);
      if (item.assigned_code) {
        console.log(`   - Code: ${item.assigned_code}`);
      }
    });
    
    return queueData;
    
  } catch (error) {
    console.error('❌ Error in searchSpecificName:', error);
    return [];
  }
};









