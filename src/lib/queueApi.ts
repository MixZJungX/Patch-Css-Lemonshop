import { supabase } from './supabase';
import { QueueItem, QueueDisplay } from '@/types';

// ฟังก์ชันทดสอบการเชื่อมต่อฐานข้อมูล
export const testQueueConnection = async (): Promise<boolean> => {
  try {
    // ทดสอบการเชื่อมต่อโดยดูโครงสร้างตาราง
    const { data, error } = await supabase
      .from('queue_items')
      .select('id, queue_number, status, created_at')
      .limit(1);
    
    if (error) {
      console.error('❌ ไม่สามารถเชื่อมต่อตาราง queue_items ได้:', error);
      console.error('รายละเอียด error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return false;
    }
    
    console.log('✅ เชื่อมต่อตาราง queue_items สำเร็จ');
    return true;
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการทดสอบการเชื่อมต่อ:', error);
    return false;
  }
};

// ฟังก์ชันทดสอบการสร้างหมายเลขคิว
export const testQueueNumberGeneration = async (): Promise<boolean> => {
  try {
    const queueNumber = await generateQueueNumber();
    console.log(`✅ สร้างหมายเลขคิวสำเร็จ: ${queueNumber}`);
    return true;
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการสร้างหมายเลขคิว:', error);
    return false;
  }
};

// สร้างหมายเลขคิวแบบเรียงลำดับ
export const generateQueueNumber = async (): Promise<number> => {
  // ดึงหมายเลขคิวสูงสุดทั้งหมด (ไม่ว่าจะสถานะใด)
  const { data: maxQueue, error } = await supabase
    .from('queue_items')
    .select('queue_number')
    .order('queue_number', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  // ถ้าไม่มีคิวใดๆ ในระบบ ให้เริ่มที่ 1
  if (!maxQueue) {
    return 1;
  }

  // ถ้ามีคิวอยู่แล้ว ให้เพิ่ม 1
  return maxQueue.queue_number + 1;
};

// เพิ่มคิวใหม่
export const addToQueue = async (queueData: any): Promise<any> => {
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
      // สร้างหมายเลขคิวแบบเรียงลำดับ
      const queueNumber = await generateQueueNumber();

      const newQueueItem = {
        ...queueData,
        queue_number: queueNumber,
        status: 'waiting',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('📝 ข้อมูลคิวที่จะสร้าง:', newQueueItem);

      const { data, error } = await supabase
        .from('queue_items')
        .insert(newQueueItem)
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating queue:', error);
        // ถ้าเกิด error เรื่อง duplicate key ให้ลองใหม่
        if (error.code === '23505' && attempts < maxAttempts - 1) {
          console.log(`⚠️ หมายเลขคิว ${queueNumber} ซ้ำ ลองใหม่...`);
          attempts++;
          // รอสักครู่ก่อนลองใหม่
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }
        throw error;
      }
      
      console.log('✅ สร้างคิวสำเร็จ:', data);
      return data;
    } catch (error) {
      console.error('❌ Error in addToQueue:', error);
      if (attempts >= maxAttempts - 1) {
        throw error;
      }
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  throw new Error('ไม่สามารถสร้างหมายเลขคิวได้หลังจากลองหลายครั้ง');
};

// ดึงข้อมูลคิวที่แสดง
export const getQueueDisplay = async (): Promise<QueueDisplay> => {
  // ดึงข้อมูลคิว
  const { data: waitingItems, error: waitingError } = await supabase
    .from('queue_items')
    .select('*')
    .eq('status', 'waiting')
    .order('created_at', { ascending: true })
    .limit(10);

  if (waitingError) throw waitingError;

  const { data: processingItem, error: processingError } = await supabase
    .from('queue_items')
    .select('*')
    .eq('status', 'processing')
    .order('updated_at', { ascending: true })
    .limit(1)
    .single();

  if (processingError && processingError.code !== 'PGRST116') throw processingError;

  // ดึงข้อมูล redemption requests
  const { data: redemptionData, error: redemptionError } = await supabase
    .from('app_284beb8f90_redemption_requests')
    .select('*');

  if (redemptionError) throw redemptionError;

  // ฟังก์ชันรวมข้อมูล
  const enrichQueueData = (queueItems: any[]) => {
    return queueItems?.map(queueItem => {
      const matchingRedemption = redemptionData?.find(redemption => {
        const queueUsername = queueItem.contact_info.match(/ชื่อ:\s*([^|]+)/)?.[1]?.trim();
        
        // จับคู่แบบหลายวิธี
        return queueItem.contact_info.includes(redemption.roblox_username) ||
               queueUsername === redemption.roblox_username ||
               queueItem.customer_name === redemption.roblox_username ||
               (queueItem.contact_info.includes('เบอร์โทร:') && redemption.contact_info.includes('เบอร์โทร:') && 
                queueItem.contact_info.match(/เบอร์โทร:\s*([^|]+)/)?.[1]?.trim() === 
                redemption.contact_info.match(/เบอร์โทร:\s*([^|]+)/)?.[1]?.trim()) ||
               (queueItem.contact_info.includes('Code:') && redemption.assigned_code && 
                queueItem.contact_info.includes(redemption.assigned_code));
      });

      // Fallback: ดึงข้อมูลจาก contact_info ถ้าไม่มีใน redemption_requests
      // รูปแบบ: "Code: 50BXJK258J | Password: 123456780 | Phone: 0821695505"
      let passwordFromContact = null;
      let codeFromContact = null;
      
      // ลองหลายรูปแบบ regex
      if (queueItem.contact_info.includes('Password:')) {
        passwordFromContact = queueItem.contact_info.match(/Password:\s*([^|]+)/)?.[1]?.trim() ||
                             queueItem.contact_info.match(/Password:\s*([^\s|]+)/)?.[1]?.trim() ||
                             queueItem.contact_info.match(/Password:\s*(.+?)(?:\s*\||$)/)?.[1]?.trim();
      }
      
      if (queueItem.contact_info.includes('Code:')) {
        codeFromContact = queueItem.contact_info.match(/Code:\s*([^|]+)/)?.[1]?.trim() ||
                         queueItem.contact_info.match(/Code:\s*([^\s|]+)/)?.[1]?.trim() ||
                         queueItem.contact_info.match(/Code:\s*(.+?)(?:\s*\||$)/)?.[1]?.trim();
      }
      
      return {
        ...queueItem,
        roblox_username: matchingRedemption?.roblox_username || queueItem.roblox_username,
        // ใช้ข้อมูลจาก contact_info เป็นหลัก (100% ข้อมูลอยู่ใน contact_info)
        roblox_password: passwordFromContact || matchingRedemption?.roblox_password || queueItem.roblox_password,
        robux_amount: matchingRedemption?.robux_amount || queueItem.robux_amount,
        assigned_code: codeFromContact || matchingRedemption?.assigned_code || queueItem.assigned_code,
        assigned_account_code: matchingRedemption?.assigned_account_code || queueItem.assigned_account_code,
        code_id: matchingRedemption?.code_id || queueItem.code_id
      };
    }) || [];
  };

  const enrichedWaitingItems = enrichQueueData(waitingItems || []);
  const enrichedProcessingItem = processingItem ? enrichQueueData([processingItem])[0] : undefined;
  const next3Items = enrichedWaitingItems.slice(0, 3);
  const totalWaiting = enrichedWaitingItems.length;
  
  // คำนวณเวลารอโดยประมาณ (เฉลี่ย 5 นาทีต่อคิว)
  const averageWaitTime = totalWaiting * 5;

  return {
    current_processing: enrichedProcessingItem,
    next_3_items: next3Items,
    total_waiting: totalWaiting,
    average_wait_time: averageWaitTime
  };
};

// เช็คสถานะคิว
export const checkQueueStatus = async (queueNumber: number): Promise<QueueItem | null> => {
  const { data: queueData, error } = await supabase
    .from('queue_items')
    .select('*')
    .eq('queue_number', queueNumber)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // ไม่พบข้อมูล
    throw error;
  }

  // ดึงข้อมูล redemption requests
  const { data: redemptionData, error: redemptionError } = await supabase
    .from('app_284beb8f90_redemption_requests')
    .select('*');

  if (redemptionError) throw redemptionError;

  // หา redemption request ที่ตรงกัน
  const matchingRedemption = redemptionData?.find(redemption => {
    const queueUsername = queueData.contact_info.match(/ชื่อ:\s*([^|]+)/)?.[1]?.trim();
    
    // จับคู่แบบหลายวิธี
    return queueData.contact_info.includes(redemption.roblox_username) ||
           queueUsername === redemption.roblox_username ||
           queueData.customer_name === redemption.roblox_username ||
           (queueData.contact_info.includes('เบอร์โทร:') && redemption.contact_info.includes('เบอร์โทร:') && 
            queueData.contact_info.match(/เบอร์โทร:\s*([^|]+)/)?.[1]?.trim() === 
            redemption.contact_info.match(/เบอร์โทร:\s*([^|]+)/)?.[1]?.trim()) ||
           (queueData.contact_info.includes('Code:') && redemption.assigned_code && 
            queueData.contact_info.includes(redemption.assigned_code));
  });

  // Fallback: ดึงข้อมูลจาก contact_info ถ้าไม่มีใน redemption_requests
  // รูปแบบ: "Code: 50BXJK258J | Password: 123456780 | Phone: 0821695505"
  let passwordFromContact = null;
  let codeFromContact = null;
  
  // ลองหลายรูปแบบ regex
  if (queueData.contact_info.includes('Password:')) {
    passwordFromContact = queueData.contact_info.match(/Password:\s*([^|]+)/)?.[1]?.trim() ||
                         queueData.contact_info.match(/Password:\s*([^\s|]+)/)?.[1]?.trim() ||
                         queueData.contact_info.match(/Password:\s*(.+?)(?:\s*\||$)/)?.[1]?.trim();
  }
  
  if (queueData.contact_info.includes('Code:')) {
    codeFromContact = queueData.contact_info.match(/Code:\s*([^|]+)/)?.[1]?.trim() ||
                     queueData.contact_info.match(/Code:\s*([^\s|]+)/)?.[1]?.trim() ||
                     queueData.contact_info.match(/Code:\s*(.+?)(?:\s*\||$)/)?.[1]?.trim();
  }
  
  return {
    ...queueData,
    roblox_username: matchingRedemption?.roblox_username || queueData.roblox_username,
    // ใช้ข้อมูลจาก contact_info เป็นหลัก (100% ข้อมูลอยู่ใน contact_info)
    roblox_password: passwordFromContact || matchingRedemption?.roblox_password || queueData.roblox_password,
    robux_amount: matchingRedemption?.robux_amount || queueData.robux_amount,
    assigned_code: codeFromContact || matchingRedemption?.assigned_code || queueData.assigned_code,
    assigned_account_code: matchingRedemption?.assigned_account_code || queueData.assigned_account_code,
    code_id: matchingRedemption?.code_id || queueData.code_id
  };
};

// ดึงตำแหน่งคิว (ลำดับที่เท่าไหร่)
export const getQueuePosition = async (queueNumber: number): Promise<number> => {
  const { data: waitingItems, error } = await supabase
    .from('queue_items')
    .select('queue_number')
    .eq('status', 'waiting')
    .order('queue_number', { ascending: true });

  if (error) throw error;

  const position = waitingItems?.findIndex(item => item.queue_number === queueNumber);
  return position !== -1 ? position + 1 : 0; // +1 เพราะ index เริ่มที่ 0
};

// อัปเดตสถานะคิว (สำหรับแอดมิน)
export const updateQueueStatus = async (
  queueId: string, 
  status: QueueItem['status'],
  adminNotes?: string
): Promise<QueueItem> => {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  };

  if (adminNotes) {
    updateData.admin_notes = adminNotes;
  }

  const { data, error } = await supabase
    .from('queue_items')
    .update(updateData)
    .eq('id', queueId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ย้ายคิวขึ้น-ลง (สำหรับแอดมิน)
export const moveQueueItem = async (queueId: string, direction: 'up' | 'down'): Promise<void> => {
  // ดึงคิวทั้งหมดที่รอ
  const { data: allWaiting, error: fetchError } = await supabase
    .from('queue_items')
    .select('id, created_at')
    .eq('status', 'waiting')
    .order('created_at', { ascending: true });

  if (fetchError) throw fetchError;

  const currentIndex = allWaiting?.findIndex(item => item.id === queueId);
  if (currentIndex === -1 || !allWaiting) throw new Error('ไม่พบคิวที่ต้องการย้าย');

  let targetIndex: number;
  if (direction === 'up' && currentIndex > 0) {
    targetIndex = currentIndex - 1;
  } else if (direction === 'down' && currentIndex < allWaiting.length - 1) {
    targetIndex = currentIndex + 1;
  } else {
    throw new Error('ไม่สามารถย้ายคิวได้');
  }

  // สลับลำดับโดยการอัปเดต created_at
  const currentItem = allWaiting[currentIndex];
  const targetItem = allWaiting[targetIndex];

  // อัปเดตลำดับ
  await supabase
    .from('queue_items')
    .update({ 
      created_at: targetItem.created_at,
      updated_at: new Date().toISOString()
    })
    .eq('id', currentItem.id);

  await supabase
    .from('queue_items')
    .update({ 
      created_at: currentItem.created_at,
      updated_at: new Date().toISOString()
    })
    .eq('id', targetItem.id);
};

// ลบคิว (สำหรับแอดมิน)
export const deleteQueueItem = async (queueId: string): Promise<void> => {
  const { error } = await supabase
    .from('queue_items')
    .delete()
    .eq('id', queueId);

  if (error) throw error;
};

// ดึงคิวทั้งหมด (สำหรับแอดมิน)
export const getAllQueueItems = async (): Promise<QueueItem[]> => {
  // ดึงข้อมูลคิว
  const { data: queueData, error: queueError } = await supabase
    .from('queue_items')
    .select('*')
    .order('created_at', { ascending: true });

  if (queueError) throw queueError;

  // ดึงข้อมูล redemption requests
  const { data: redemptionData, error: redemptionError } = await supabase
    .from('app_284beb8f90_redemption_requests')
    .select('*')
    .order('created_at', { ascending: true });

  if (redemptionError) throw redemptionError;

  console.log('📊 ข้อมูลที่ดึงมา:', {
    queueData: queueData?.length,
    redemptionData: redemptionData?.length,
    sampleQueue: queueData?.[0],
    sampleRedemption: redemptionData?.[0]
  });

  // รวมข้อมูลโดยการจับคู่จาก contact_info หรือ customer_name
  const enrichedData = queueData?.map(queueItem => {
    // หา redemption request ที่ตรงกัน - ใช้วิธีที่เร็วขึ้น
    const matchingRedemption = redemptionData?.find(redemption => {
      // จับคู่จาก username ใน contact_info
      const queueUsername = queueItem.contact_info?.match(/ชื่อ:\s*([^|]+)/)?.[1]?.trim();
      
      // จับคู่แบบหลายวิธี
      return (
        // วิธีที่ 1: username อยู่ใน contact_info
        queueItem.contact_info?.includes(redemption.roblox_username) ||
        // วิธีที่ 2: username ที่แยกออกมาเท่ากัน
        queueUsername === redemption.roblox_username ||
        // วิธีที่ 3: customer_name เท่ากับ username (ถ้ามี)
        queueItem.customer_name === redemption.roblox_username ||
        // วิธีที่ 4: ดูจากเบอร์โทร
        (queueItem.contact_info?.includes('เบอร์โทร:') && redemption.contact_info?.includes('เบอร์โทร:') && 
         queueItem.contact_info.match(/เบอร์โทร:\s*([^|]+)/)?.[1]?.trim() === 
         redemption.contact_info.match(/เบอร์โทร:\s*([^|]+)/)?.[1]?.trim()) ||
        // วิธีที่ 5: ดูจาก Code ใน contact_info
        (queueItem.contact_info?.includes('Code:') && redemption.assigned_code && 
         queueItem.contact_info.includes(redemption.assigned_code))
      );
    });

    // Fallback: ดึงข้อมูลจาก contact_info ถ้าไม่มีใน redemption_requests
    // รูปแบบ: "Code: 50BXJK258J | Password: 123456780 | Phone: 0821695505"
    const sourceContact = matchingRedemption?.contact_info || queueItem.contact_info;
    let passwordFromContact = null;
    let codeFromContact = null;
    
    // ลองหลายรูปแบบ regex จาก sourceContact
    if (sourceContact && sourceContact.includes('Password:')) {
      passwordFromContact = sourceContact.match(/Password:\s*([^|]+)/)?.[1]?.trim() ||
                           sourceContact.match(/Password:\s*([^\s|]+)/)?.[1]?.trim() ||
                           sourceContact.match(/Password:\s*(.+?)(?:\s*\||$)/)?.[1]?.trim();
    }
    
    if (sourceContact && sourceContact.includes('Code:')) {
      codeFromContact = sourceContact.match(/Code:\s*([^|]+)/)?.[1]?.trim() ||
                       sourceContact.match(/Code:\s*([^\s|]+)/)?.[1]?.trim() ||
                       sourceContact.match(/Code:\s*(.+?)(?:\s*\||$)/)?.[1]?.trim();
    }
    
    // ลบ console.log เพื่อลด log spam
    
    const result = {
      ...queueItem,
      roblox_username: matchingRedemption?.roblox_username || queueItem.roblox_username,
      // ใช้ข้อมูลจาก contact_info เป็นหลัก (100% ข้อมูลอยู่ใน contact_info)
      roblox_password: passwordFromContact || matchingRedemption?.roblox_password || queueItem.roblox_password,
      robux_amount: matchingRedemption?.robux_amount || queueItem.robux_amount,
      assigned_code: codeFromContact || matchingRedemption?.assigned_code || queueItem.assigned_code,
      assigned_account_code: matchingRedemption?.assigned_account_code || queueItem.assigned_account_code,
      code_id: matchingRedemption?.code_id || queueItem.code_id
    };
    
    return result;
  }) || [];
  
  return enrichedData;
};
