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
export const addToQueue = async (queueData: Partial<QueueItem>): Promise<QueueItem> => {
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
      // สร้างหมายเลขคิวแบบเรียงลำดับ
      const queueNumber = await generateQueueNumber();

      const newQueueItem: Partial<QueueItem> = {
        ...queueData,
        queue_number: queueNumber,
        status: 'waiting',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('queue_items')
        .insert(newQueueItem)
        .select()
        .single();

      if (error) {
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
      
      return data;
    } catch (error) {
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

  const next3Items = waitingItems?.slice(0, 3) || [];
  const totalWaiting = waitingItems?.length || 0;
  
  // คำนวณเวลารอโดยประมาณ (เฉลี่ย 5 นาทีต่อคิว)
  const averageWaitTime = totalWaiting * 5;

  return {
    current_processing: processingItem || undefined,
    next_3_items: next3Items,
    total_waiting: totalWaiting,
    average_wait_time: averageWaitTime
  };
};

// เช็คสถานะคิว
export const checkQueueStatus = async (queueNumber: number): Promise<QueueItem | null> => {
  const { data, error } = await supabase
    .from('queue_items')
    .select('*')
    .eq('queue_number', queueNumber)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // ไม่พบข้อมูล
    throw error;
  }

  return data;
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
  const { data, error } = await supabase
    .from('queue_items')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
};
