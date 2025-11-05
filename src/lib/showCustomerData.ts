import { supabase } from './supabase';

// ฟังก์ชันแสดงข้อมูล customer_name และ contact_info
export const showCustomerData = async () => {
  console.log('🔍 แสดงข้อมูล customer_name และ contact_info...');
  
  try {
    // ดึงข้อมูลทั้งหมดจาก queue_items
    const { data: queueData, error } = await supabase
      .from('queue_items')
      .select('queue_number, customer_name, contact_info, roblox_username, status, created_at')
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
    console.log('📋 ข้อมูล customer_name และ contact_info:');
    console.log('='.repeat(100));
    
    queueData.forEach((item, index) => {
      console.log(`\n${index + 1}. คิว #${item.queue_number} (${item.status})`);
      console.log(`   📅 สร้างเมื่อ: ${new Date(item.created_at).toLocaleString('th-TH')}`);
      
      // แสดง customer_name
      if (item.customer_name) {
        console.log(`   👤 Customer Name: "${item.customer_name}"`);
      } else {
        console.log(`   👤 Customer Name: [ไม่มีข้อมูล]`);
      }
      
      // แสดง roblox_username
      if (item.roblox_username) {
        console.log(`   🎮 Roblox Username: "${item.roblox_username}"`);
      } else {
        console.log(`   🎮 Roblox Username: [ไม่มีข้อมูล]`);
      }
      
      // แสดง contact_info
      if (item.contact_info) {
        console.log(`   📝 Contact Info: "${item.contact_info}"`);
        
        // แยกข้อมูลใน contact_info
        const contactParts = item.contact_info.split('|');
        if (contactParts.length > 1) {
          console.log(`   📋 แยกข้อมูล Contact Info:`);
          contactParts.forEach((part, partIndex) => {
            const trimmedPart = part.trim();
            if (trimmedPart) {
              console.log(`      ${partIndex + 1}. ${trimmedPart}`);
            }
          });
        }
      } else {
        console.log(`   📝 Contact Info: [ไม่มีข้อมูล]`);
      }
      
      console.log('   ' + '-'.repeat(80));
    });
    
    // สรุปข้อมูล
    console.log('\n📊 สรุปข้อมูล:');
    console.log('='.repeat(100));
    
    const hasCustomerName = queueData.filter(item => item.customer_name).length;
    const hasRobloxUsername = queueData.filter(item => item.roblox_username).length;
    const hasContactInfo = queueData.filter(item => item.contact_info).length;
    
    console.log(`👤 มี Customer Name: ${hasCustomerName}/${queueData.length} รายการ`);
    console.log(`🎮 มี Roblox Username: ${hasRobloxUsername}/${queueData.length} รายการ`);
    console.log(`📝 มี Contact Info: ${hasContactInfo}/${queueData.length} รายการ`);
    
    // แสดงตัวอย่าง customer_name
    const customerNames = queueData
      .filter(item => item.customer_name)
      .map(item => item.customer_name)
      .slice(0, 10);
    
    if (customerNames.length > 0) {
      console.log('\n👤 ตัวอย่าง Customer Names:');
      customerNames.forEach((name, index) => {
        console.log(`   ${index + 1}. "${name}"`);
      });
    }
    
    // แสดงตัวอย่าง roblox_username
    const robloxUsernames = queueData
      .filter(item => item.roblox_username)
      .map(item => item.roblox_username)
      .slice(0, 10);
    
    if (robloxUsernames.length > 0) {
      console.log('\n🎮 ตัวอย่าง Roblox Usernames:');
      robloxUsernames.forEach((username, index) => {
        console.log(`   ${index + 1}. "${username}"`);
      });
    }
    
    // แสดงตัวอย่าง contact_info
    const contactInfos = queueData
      .filter(item => item.contact_info)
      .map(item => item.contact_info)
      .slice(0, 5);
    
    if (contactInfos.length > 0) {
      console.log('\n📝 ตัวอย่าง Contact Info:');
      contactInfos.forEach((contact, index) => {
        console.log(`   ${index + 1}. "${contact}"`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error in showCustomerData:', error);
  }
};

// ฟังก์ชันค้นหาข้อมูลเฉพาะ
export const searchCustomerData = async (searchTerm: string) => {
  console.log(`🔍 ค้นหาข้อมูล "${searchTerm}" ใน customer_name และ contact_info...`);
  
  const searchLower = searchTerm.toLowerCase().trim();
  
  try {
    const { data: queueData, error } = await supabase
      .from('queue_items')
      .select('*')
      .or(`customer_name.ilike.%${searchLower}%,contact_info.ilike.%${searchLower}%,roblox_username.ilike.%${searchLower}%`);
    
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
      console.log(`\n${index + 1}. คิว #${item.queue_number} (${item.status})`);
      console.log(`   👤 Customer Name: ${item.customer_name || '[ไม่มีข้อมูล]'}`);
      console.log(`   🎮 Roblox Username: ${item.roblox_username || '[ไม่มีข้อมูล]'}`);
      console.log(`   📝 Contact Info: ${item.contact_info || '[ไม่มีข้อมูล]'}`);
      console.log(`   📅 สร้างเมื่อ: ${new Date(item.created_at).toLocaleString('th-TH')}`);
    });
    
    return queueData;
    
  } catch (error) {
    console.error('❌ Error in searchCustomerData:', error);
    return [];
  }
};

// ฟังก์ชันวิเคราะห์รูปแบบข้อมูล
export const analyzeDataPatterns = async () => {
  console.log('🔍 วิเคราะห์รูปแบบข้อมูล customer_name และ contact_info...');
  
  try {
    const { data: queueData, error } = await supabase
      .from('queue_items')
      .select('customer_name, contact_info, roblox_username')
      .limit(50);
    
    if (error) {
      console.error('❌ Error loading data:', error);
      return;
    }
    
    if (!queueData || queueData.length === 0) {
      console.log('❌ ไม่พบข้อมูล');
      return;
    }
    
    console.log('📊 วิเคราะห์รูปแบบข้อมูล:');
    console.log('='.repeat(80));
    
    // วิเคราะห์ customer_name
    const customerNamePatterns = new Map<string, number>();
    const robloxUsernamePatterns = new Map<string, number>();
    const contactInfoPatterns = new Map<string, number>();
    
    queueData.forEach(item => {
      // วิเคราะห์ customer_name
      if (item.customer_name) {
        const pattern = item.customer_name.length > 10 ? 'ยาว (>10 ตัวอักษร)' : 'สั้น (≤10 ตัวอักษร)';
        customerNamePatterns.set(pattern, (customerNamePatterns.get(pattern) || 0) + 1);
      }
      
      // วิเคราะห์ roblox_username
      if (item.roblox_username) {
        const pattern = item.roblox_username.length > 10 ? 'ยาว (>10 ตัวอักษร)' : 'สั้น (≤10 ตัวอักษร)';
        robloxUsernamePatterns.set(pattern, (robloxUsernamePatterns.get(pattern) || 0) + 1);
      }
      
      // วิเคราะห์ contact_info
      if (item.contact_info) {
        const hasName = item.contact_info.includes('ชื่อ:') || item.contact_info.includes('Username:');
        const hasPhone = item.contact_info.includes('เบอร์โทร:') || item.contact_info.includes('Phone:');
        const hasCode = item.contact_info.includes('Code:');
        const hasPassword = item.contact_info.includes('Password:');
        
        if (hasName) contactInfoPatterns.set('มีชื่อ', (contactInfoPatterns.get('มีชื่อ') || 0) + 1);
        if (hasPhone) contactInfoPatterns.set('มีเบอร์โทร', (contactInfoPatterns.get('มีเบอร์โทร') || 0) + 1);
        if (hasCode) contactInfoPatterns.set('มีโค้ด', (contactInfoPatterns.get('มีโค้ด') || 0) + 1);
        if (hasPassword) contactInfoPatterns.set('มีรหัสผ่าน', (contactInfoPatterns.get('มีรหัสผ่าน') || 0) + 1);
      }
    });
    
    console.log('\n👤 รูปแบบ Customer Name:');
    customerNamePatterns.forEach((count, pattern) => {
      console.log(`   ${pattern}: ${count} รายการ`);
    });
    
    console.log('\n🎮 รูปแบบ Roblox Username:');
    robloxUsernamePatterns.forEach((count, pattern) => {
      console.log(`   ${pattern}: ${count} รายการ`);
    });
    
    console.log('\n📝 รูปแบบ Contact Info:');
    contactInfoPatterns.forEach((count, pattern) => {
      console.log(`   ${pattern}: ${count} รายการ`);
    });
    
  } catch (error) {
    console.error('❌ Error in analyzeDataPatterns:', error);
  }
};















