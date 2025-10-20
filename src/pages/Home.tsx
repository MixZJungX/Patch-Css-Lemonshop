import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RedemptionRequest, RedemptionCode, ChickenAccount, QueueItem } from '@/types';
import { GamepadIcon, Settings, Megaphone, MessageCircle } from 'lucide-react';
import { addToQueue, testQueueConnection, testQueueNumberGeneration } from '@/lib/queueApi';
import '@/styles/notifications.css';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'redeem' | 'rainbow'>('redeem');
  type Announcement = {
    id: string;
    title?: string;
    content: string;
    type?: 'info' | 'warning' | 'critical';
    link?: string;
    is_active?: boolean;
    created_at?: string;
  };
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  
  // Rainbow Six form states
  const [rainbowForm, setRainbowForm] = useState({
    ubisoftEmail: '',
    ubisoftPassword: '',
    hasXboxAccount: false,
    xboxEmail: '',
    xboxPassword: '',
    redeemCode: '',
    contact: '',
    phoneNumber: ''
  });
  const [showRainbowRedeemPopup, setShowRainbowRedeemPopup] = useState(false);
  const [isRainbowButtonSubmitting, setIsRainbowButtonSubmitting] = useState(false);
  const [rainbowGameInfo, setRainbowGameInfo] = useState<{ code: string } | null>(null);
  const [availableRainbowCodes, setAvailableRainbowCodes] = useState<any[]>([]);
  const [totalRainbowCredits, setTotalRainbowCredits] = useState(0);
  
  // Chicken account redemption states
  const [chickenRedeemCode, setChickenRedeemCode] = useState('');
  const [validatedChickenAccount, setValidatedChickenAccount] = useState<ChickenAccount | null>(null);
  const [showChickenRedeemPopup, setShowChickenRedeemPopup] = useState(false);
  const [availableCodes, setAvailableCodes] = useState<RedemptionCode[]>([]);
  const [availableAccounts, setAvailableAccounts] = useState<ChickenAccount[]>([]);
  const [totalRobuxValue, setTotalRobuxValue] = useState(0);
  const [totalActiveAccounts, setTotalActiveAccounts] = useState(0);
  
  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRobuxButtonSubmitting, setIsRobuxButtonSubmitting] = useState(false);
  const [isChickenButtonSubmitting, setIsChickenButtonSubmitting] = useState(false);
  
  // Code redemption states
  const [redeemCode, setRedeemCode] = useState('');
  const [validatedCode, setValidatedCode] = useState<RedemptionCode | null>(null);
  const [showRedeemPopup, setShowRedeemPopup] = useState(false);
  const [redeemForm, setRedeemForm] = useState({
    username: '',
    password: '',
    contact: ''
  });

  // ระบบคิว
  const [showQueueNumberPopup, setShowQueueNumberPopup] = useState(false);
  const [currentQueueNumber, setCurrentQueueNumber] = useState<number | null>(null);

  // Roblox preparation guide
  const [showRobloxGuide, setShowRobloxGuide] = useState(false);
  const [hasReadGuide, setHasReadGuide] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showStepDialog, setShowStepDialog] = useState(false);
  const [step1Completed, setStep1Completed] = useState(false);
  const [step2Completed, setStep2Completed] = useState(false);
  const [allStepsRead, setAllStepsRead] = useState(false);
  
  // Line QR Code popup
  const [showLineQRPopup, setShowLineQRPopup] = useState(false);
  
  // Advertisement popup
  const [showAdPopup, setShowAdPopup] = useState(false);
  const [adData, setAdData] = useState<{
    id: string;
    title: string;
    image_url: string;
    link_url?: string;
    is_active: boolean;
  } | null>(null);

  useEffect(() => {
    loadAvailableItems();
    loadAnnouncements();
    loadAdvertisement();
    
    // ทดสอบการเชื่อมต่อระบบคิว
    testQueueConnection().then(isConnected => {
      if (!isConnected) {
        console.warn('⚠️ ระบบคิวไม่พร้อมใช้งาน - กรุณารัน SQL script ใน Supabase');
        toast.error('ระบบคิวไม่พร้อมใช้งาน กรุณาติดต่อแอดมิน');
      }
    });
  }, []);

  // Calculate statistics when data changes
  useEffect(() => {
    if (availableCodes.length > 0) {
              const totalValue = availableCodes.reduce((sum, code) => sum + (code.robux_value || 0), 0);
      setTotalRobuxValue(totalValue);
    }
  }, [availableCodes]);

  useEffect(() => {
    if (availableAccounts.length > 0) {
      const activeAccounts = availableAccounts.filter(account => account.status === 'available').length;
      setTotalActiveAccounts(activeAccounts);
    }
  }, [availableAccounts]);

  useEffect(() => {
    if (availableRainbowCodes.length > 0) {
      const totalCredits = availableRainbowCodes.reduce((sum, code) => sum + (code.credits || 0), 0);
      setTotalRainbowCredits(totalCredits);
    }
  }, [availableRainbowCodes]);

  const loadAvailableItems = async () => {
    try {
      // Load Robux codes
      const { data: codes, error: codesError } = await supabase
        .from('app_284beb8f90_redemption_codes')
        .select('*')
        .eq('status', 'available');
      
      // Load Chicken accounts
      const { data: accounts, error: accountsError } = await supabase
        .from('app_284beb8f90_chicken_accounts')
        .select('*')
        .eq('status', 'available');

      // Load Rainbow Six codes
      const { data: rainbowCodes, error: rainbowError } = await supabase
        .from('app_284beb8f90_rainbow_codes')
        .select('*')
        .eq('is_used', false);

      if (codesError || accountsError) {
        import('@/lib/mockData').then(({ mockCodes, mockAccounts }) => {
          setAvailableCodes(mockCodes);
          setAvailableAccounts(mockAccounts);
          toast.info('เชื่อมต่อโหมดทดสอบ - ข้อมูลตัวอย่างถูกแสดง');
        });
      } else {
        setAvailableCodes(codes || []);
        setAvailableAccounts(accounts || []);
      }

      // Set Rainbow Six codes (independent of other data)
      if (rainbowError) {
        console.warn('Could not load Rainbow Six codes from Supabase:', rainbowError);
        setAvailableRainbowCodes([]);
      } else {
        setAvailableRainbowCodes(rainbowCodes || []);
        console.log('✅ Loaded Rainbow Six codes from Supabase:', rainbowCodes?.length || 0, 'codes');
      }
    } catch (error) {
      console.error('Error loading items:', error);
      import('@/lib/mockData').then(({ mockCodes, mockAccounts }) => {
        setAvailableCodes(mockCodes);
        setAvailableAccounts(mockAccounts);
      });
      setAvailableRainbowCodes([]);
    }
  };

  const loadAnnouncements = async () => {
    try {
      // Try Supabase first
      const { data, error } = await supabase
        .from('app_284beb8f90_announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        throw error;
      }

      const mapped: Announcement[] = (data || []).map((a: any) => ({
        id: a.id,
        title: a.title,
        content: a.content || a.message,
        type: a.type || 'info',
        link: a.link || undefined,
        is_active: a.is_active,
        created_at: a.created_at,
      }));

      setAnnouncements(mapped);
    } catch (_e) {
      setAnnouncements([]);
    }
  };

  const loadAdvertisement = async () => {
    try {
      // ตรวจสอบว่าเคยปิด popup นี้แล้วหรือไม่
      const adClosed = localStorage.getItem('ad_popup_closed');
      if (adClosed) {
        return; // ไม่แสดง popup ถ้าเคยปิดแล้ว
      }

      // โหลดโฆษณาจาก Supabase
      const { data, error } = await supabase
        .from('app_284beb8f90_advertisements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        console.log('ไม่มีโฆษณาแสดง');
        return;
      }

      setAdData(data);
      
      // แสดง popup หลังจาก 1 วินาที
      setTimeout(() => {
        setShowAdPopup(true);
      }, 1000);
      
    } catch (error) {
      console.error('Error loading advertisement:', error);
    }
  };

  const handleCloseAdPopup = () => {
    setShowAdPopup(false);
    // จำการปิด popup นี้ไว้ 24 ชั่วโมง
    localStorage.setItem('ad_popup_closed', Date.now().toString());
  };

  const handleAdClick = () => {
    if (adData?.link_url) {
      window.open(adData.link_url, '_blank');
    }
  };

  const getAlertVariant = (type?: string) => (type === 'critical' ? 'destructive' : 'default');

  const validateCode = async () => {
    if (!redeemCode.trim()) {
      toast.error("กรุณากรอกโค้ดที่ได้รับ");
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('🔍 กำลังค้นหาโค้ด:', redeemCode.trim());
      
      // ค้นหาจากทั้ง 2 ตารางพร้อมกัน (Robux และ Chicken)
      const [robuxResult, chickenResult] = await Promise.all([
        // 1. ค้นหาใน Robux codes
        supabase
          .from('app_284beb8f90_redemption_codes')
          .select('*')
          .ilike('code', redeemCode.trim())
          .maybeSingle(),
        
        // 2. ค้นหาใน Chicken accounts
        supabase
          .from('app_284beb8f90_chicken_accounts')
          .select('*')
          .ilike('code', redeemCode.trim())
          .limit(1)
      ]);

      console.log('📊 ผลการค้นหา:', {
        robux: robuxResult.data ? '✅ เจอ' : '❌ ไม่เจอ',
        chicken: (chickenResult.data && chickenResult.data.length > 0) ? '✅ เจอ' : '❌ ไม่เจอ'
      });

      // ตรวจสอบว่าเจอโค้ดในตารางไหน
      let codeData = null;
      let codeType = null;

      if (robuxResult.data) {
        console.log('✅ พบโค้ด Robux');
        codeData = robuxResult.data;
        codeType = 'robux';
        
        // Check if Robux code has been used
        if (codeData.status !== 'available') {
          toast.error("โค้ด Robux นี้ถูกใช้งานไปแล้ว");
          return;
        }
      } else if (chickenResult.data && chickenResult.data.length > 0) {
        console.log('✅ พบโค้ดไก่ตัน');
        codeData = chickenResult.data[0];
        codeType = 'chicken';
        
        // ไก่ตัน: ไม่เช็ค status - ให้ใช้ได้ไม่จำกัดรอบ
        console.log('🐔 ไก่ตันใช้ได้ไม่จำกัดรอบ - status:', codeData.status);
      }

      // If code doesn't exist in either table
      if (!codeData) {
        toast.error("ไม่พบโค้ดในระบบ - กรุณาตรวจสอบและพิมพ์ใหม่ หรือติดต่อไลน์");
        return;
      }

      // ถ้าเป็นโค้ดไก่ตัน ให้แสดงข้อมูลบัญชีเลย
      if (codeType === 'chicken') {
        setValidatedChickenAccount(codeData);
        setShowChickenRedeemPopup(true);
        
        // อัพเดทสถานะเป็น used
        await supabase
          .from('app_284beb8f90_chicken_accounts')
          .update({ 
            status: 'used',
            used_by: 'anonymous_user',
            used_at: new Date().toISOString()
          })
          .eq('id', codeData.id);
        
        toast.success("🐔 พบบัญชีไก่ตัน! กรุณาบันทึกข้อมูลทันที");
      } else {
        // ถ้าเป็น Robux ให้แสดงฟอร์มกรอกข้อมูล
        setValidatedCode(codeData);
        
        if (!hasReadGuide) {
          setShowRobloxGuide(true);
          return;
        }
        
        setShowRedeemPopup(true);
        toast.success("โค้ดถูกต้อง! กรุณากรอกข้อมูลเพื่อรับ Robux");
      }

    } catch (error) {
      console.error('Error validating code:', error);
      toast.error("เกิดข้อผิดพลาดในการตรวจสอบโค้ด");
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleRobuxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!redeemForm.username.trim() || !redeemForm.password.trim() || !redeemForm.contact.trim()) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^0[0-9]{8,9}$/;
    if (!phoneRegex.test(redeemForm.contact.replace(/\s|-/g, ''))) {
      toast.error("กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (เช่น 0812345678)");
      return;
    }

    setIsRobuxButtonSubmitting(true);
    const toastId = toast.loading('กำลังดำเนินการแลกโค้ด...');

    try {
      // First, update the code status to 'used' in Supabase
      const { error: updateError } = await supabase
        .from('app_284beb8f90_redemption_codes')
        .update({ 
          status: 'used',
          used_by: redeemForm.contact,
          used_at: new Date().toISOString()
        })
        .eq('id', validatedCode!.id);

      if (updateError) {
        console.error('❌ ไม่สามารถอัพเดทสถานะโค้ดใน Supabase ได้:', updateError);
        toast.error('เกิดข้อผิดพลาดในการอัพเดทโค้ด กรุณาลองใหม่อีกครั้ง', { id: toastId });
        return;
      }

      // สร้าง redemption request ในตารางหลัก
      try {
        const requestData = {
          roblox_username: redeemForm.username,
          roblox_password: redeemForm.password,
          robux_amount: validatedCode!.robux_value || 0,
          contact_info: `ชื่อ: ${redeemForm.username} | เบอร์โทร: ${redeemForm.contact}`,
          phone: redeemForm.contact,
          status: 'pending',
          assigned_code: validatedCode!.code,
          code_id: validatedCode!.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        console.log('📝 สร้าง request data:', requestData);
        console.log('🔑 โค้ดที่ใช้:', validatedCode!.code);

        // ตรวจสอบว่าโค้ดถูกใช้แล้วหรือไม่ก่อนสร้างคำขอ
        console.log('🔍 ตรวจสอบโค้ดซ้ำ:', validatedCode!.code);
        const { data: existingCode, error: checkError } = await supabase
          .from('app_284beb8f90_redemption_requests')
          .select('id, assigned_code, status')
          .eq('assigned_code', validatedCode!.code)
          .limit(1);
          
        if (checkError) {
          console.error('❌ ไม่สามารถตรวจสอบโค้ดได้:', checkError);
        } else if (existingCode && existingCode.length > 0) {
          console.log('⚠️ โค้ดนี้ถูกใช้แล้ว:', existingCode[0]);
          toast.error('โค้ดนี้ถูกใช้งานไปแล้ว กรุณาใช้โค้ดอื่น', { id: toastId });
          return;
        } else {
          console.log('✅ โค้ดพร้อมใช้งาน');
        }

        // Save the redemption request
        const { error: saveError } = await supabase
          .from('app_284beb8f90_redemption_requests')
          .insert([requestData]);
          
        if (saveError) {
          console.error('❌ ไม่สามารถสร้างคำขอได้:', saveError);
          console.error('รายละเอียด error:', {
            code: saveError.code,
            message: saveError.message,
            details: saveError.details,
            hint: saveError.hint
          });
          console.error('📝 requestData ที่พยายามบันทึก:', requestData);
          
          // ตรวจสอบว่าเป็น duplicate key error หรือไม่
          if (saveError.message.includes('duplicate key') || saveError.code === '23505') {
            toast.error('โค้ดนี้ถูกใช้งานไปแล้ว กรุณาใช้โค้ดอื่น', { id: toastId });
            return;
          }
          
          // ถ้าเกิด error ให้ลองบันทึกแบบเรียบง่าย
          try {
            const simpleRequestData = {
              roblox_username: redeemForm.username,
              robux_amount: validatedCode!.robux_value || 0,
              contact_info: `Code: ${validatedCode!.code} | Password: ${redeemForm.password} | Phone: ${redeemForm.contact}`,
              status: 'pending',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            const { error: simpleError } = await supabase
              .from('app_284beb8f90_redemption_requests')
              .insert([simpleRequestData]);
              
            if (simpleError) {
              console.error('❌ ไม่สามารถบันทึกแบบเรียบง่ายได้:', simpleError);
              if (simpleError.message.includes('duplicate key') || simpleError.code === '23505') {
                toast.error('โค้ดนี้ถูกใช้งานไปแล้ว กรุณาใช้โค้ดอื่น', { id: toastId });
              } else {
                toast.error('เกิดข้อผิดพลาดในการสร้างคำขอ กรุณาลองใหม่อีกครั้ง', { id: toastId });
              }
              return;
            }
            
            console.log('✅ บันทึกแบบเรียบง่ายสำเร็จ');
            
          } catch (simpleError) {
            console.error('❌ ไม่สามารถบันทึกแบบเรียบง่ายได้:', simpleError);
            toast.error('เกิดข้อผิดพลาดในการสร้างคำขอ กรุณาลองใหม่อีกครั้ง', { id: toastId });
            return;
          }
        }

        console.log('✅ สร้างคำขอสำเร็จ');

        // เพิ่มคิวใหม่
        try {
          const queueData = {
            // ใช้เฉพาะคอลัมน์ที่มีอยู่จริงในตาราง queue_items
            contact_info: `ชื่อ: ${redeemForm.username} | เบอร์โทร: ${redeemForm.contact}`,
            product_type: 'robux',
            status: 'waiting',
            estimated_wait_time: 15
          };
          
          const newQueueItem = await addToQueue(queueData);
          console.log('✅ เพิ่มคิวสำเร็จ:', newQueueItem);
          
          // แสดงหมายเลขคิวให้ลูกค้า
          toast.success(`✅ แลกโค้ดสำเร็จ! หมายเลขคิวของคุณคือ #${newQueueItem.queue_number}`, { id: toastId });
          
          // แสดง popup หมายเลขคิว
          setShowQueueNumberPopup(true);
          setCurrentQueueNumber(newQueueItem.queue_number);
          
          // นำทางไปยังหน้าเช็คสถานะคิวหลังจาก 3 วินาที
          setTimeout(() => {
            window.open('/queue-status', '_blank');
          }, 3000);
          
        } catch (queueError) {
          console.error('❌ ไม่สามารถเพิ่มคิวได้:', queueError);
          
          // แสดงรายละเอียด error เพื่อ debug
          if (queueError instanceof Error) {
            console.error('Error details:', {
              message: queueError.message,
              name: queueError.name,
              stack: queueError.stack
            });
          } else {
            console.error('Queue error object:', queueError);
          }
          
          // ลองสร้างคิวแบบง่ายๆ
          try {
            console.log('🔄 ลองสร้างคิวแบบง่ายๆ...');
            
            // ตรวจสอบโครงสร้างตารางก่อน
            const { data: tableInfo, error: tableError } = await supabase
              .from('queue_items')
              .select('*')
              .limit(1);
              
            if (tableError) {
              console.error('❌ ไม่สามารถเข้าถึงตาราง queue_items ได้:', tableError);
              toast.success(`✅ แลกโค้ดสำเร็จ! (ตารางคิวไม่พร้อมใช้งาน)`, { id: toastId });
              return;
            }
            
            console.log('✅ ตาราง queue_items พร้อมใช้งาน');
            
            // สร้างหมายเลขคิวแบบง่าย
            const { data: maxQueue, error: maxError } = await supabase
              .from('queue_items')
              .select('queue_number')
              .order('queue_number', { ascending: false })
              .limit(1)
              .single();
              
            const nextQueueNumber = maxQueue ? maxQueue.queue_number + 1 : 1;
            
            const simpleQueueData = {
              queue_number: nextQueueNumber,
              contact_info: `ชื่อ: ${redeemForm.username} | เบอร์โทร: ${redeemForm.contact}`,
              product_type: 'robux',
              status: 'waiting',
              estimated_wait_time: 15
            };
            
            console.log('📝 ข้อมูลคิวที่จะสร้าง:', simpleQueueData);
            
            const { data: simpleQueue, error: simpleQueueError } = await supabase
              .from('queue_items')
              .insert(simpleQueueData)
              .select()
              .single();
              
            if (simpleQueueError) {
              console.error('❌ ไม่สามารถสร้างคิวแบบง่ายได้:', simpleQueueError);
              console.error('Simple queue error details:', {
                code: simpleQueueError.code,
                message: simpleQueueError.message,
                details: simpleQueueError.details,
                hint: simpleQueueError.hint
              });
              toast.success(`✅ แลกโค้ดสำเร็จ! (คิวไม่พร้อมใช้งาน)`, { id: toastId });
            } else {
              console.log('✅ สร้างคิวแบบง่ายสำเร็จ:', simpleQueue);
              toast.success(`✅ แลกโค้ดสำเร็จ! หมายเลขคิวของคุณคือ #${simpleQueue.queue_number}`, { id: toastId });
              
              // แสดง popup หมายเลขคิว
              setShowQueueNumberPopup(true);
              setCurrentQueueNumber(simpleQueue.queue_number);
              
              // นำทางไปยังหน้าเช็คสถานะคิวหลังจาก 3 วินาที
              setTimeout(() => {
                window.open('/queue-status', '_blank');
              }, 3000);
            }
          } catch (simpleError) {
            console.error('❌ ไม่สามารถสร้างคิวแบบง่ายได้:', simpleError);
            toast.success(`✅ แลกโค้ดสำเร็จ! (คิวไม่พร้อมใช้งาน)`, { id: toastId });
          }
        }
        
      } catch (requestError) {
        console.error('❌ ไม่สามารถสร้างคำขอได้:', requestError);
        toast.error('เกิดข้อผิดพลาดในการสร้างคำขอ กรุณาลองใหม่อีกครั้ง', { id: toastId });
      }
      
      setShowRedeemPopup(false);
      setValidatedCode(null);
      setRedeemCode('');
      setRedeemForm({ username: '', password: '', contact: '' });
      
      loadAvailableItems();

    } catch (error) {
      console.error('Error submitting redemption:', error);
      toast.error('เกิดข้อผิดพลาดในการดำเนินการ', { id: toastId });
    } finally {
      setIsRobuxButtonSubmitting(false);
    }
  };

  const handleGuideRead = () => {
    // ตรวจสอบว่าทำขั้นตอนที่ 1 และ 2 เสร็จแล้วหรือยัง
    if (!step1Completed || !step2Completed) {
      toast.error("กรุณาทำตามขั้นตอนที่ 1 และ 2 ให้เสร็จก่อน");
      return;
    }
    
    // ตรวจสอบว่าอ่านทั้งหมดเสร็จแล้วหรือยัง
    if (!allStepsRead) {
      toast.error("กรุณายืนยันว่าอ่านทั้งหมดเสร็จแล้ว");
      return;
    }
    
    setHasReadGuide(true);
    setShowRobloxGuide(false);
    // หลังจากอ่านเสร็จ ให้เปิด modal แลกโค้ดต่อ
    setShowRedeemPopup(true);
  };

  const handleStepClick = (stepNumber: number) => {
    setCurrentStep(stepNumber);
    setShowStepDialog(true);
  };

  const handleStepDialogClose = () => {
    setShowStepDialog(false);
  };

  const handleRainbowRedeemCode = async () => {
    if (!rainbowForm.redeemCode.trim()) {
      toast.error("กรุณากรอกโค้ดเกม Rainbow Six");
      return;
    }

    if (!rainbowForm.ubisoftEmail.trim() || !rainbowForm.ubisoftPassword.trim()) {
      toast.error("กรุณากรอกข้อมูล Ubisoft ให้ครบถ้วน");
      return;
    }

    if (rainbowForm.hasXboxAccount && (!rainbowForm.xboxEmail.trim() || !rainbowForm.xboxPassword.trim())) {
      toast.error("กรุณากรอกข้อมูล Xbox ให้ครบถ้วน");
      return;
    }

    if (!rainbowForm.contact.trim()) {
      toast.error("กรุณากรอกข้อมูลติดต่อ");
      return;
    }

    if (!rainbowForm.phoneNumber.trim()) {
      toast.error("กรุณากรอกเบอร์โทรศัพท์");
      return;
    }

    // Check if the redeem code exists in the Rainbow Six codes table and get credits info
    let codeData = null;
    try {
      const { data: codeCheck, error: codeError } = await supabase
        .from('app_284beb8f90_rainbow_codes')
        .select('*')
        .eq('code', rainbowForm.redeemCode)
        .eq('is_used', false)
        .single();

      if (codeError || !codeCheck) {
        toast.error('โค้ดที่กรอกไม่ถูกต้องหรือไม่พร้อมใช้งาน กรุณาตรวจสอบโค้ด Rainbow Six อีกครั้ง');
        return;
      }
      codeData = codeCheck;
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการตรวจสอบโค้ด กรุณาลองใหม่อีกครั้ง');
      return;
    }

    setIsRainbowButtonSubmitting(true);
    const toastId = toast.loading('กำลังส่งคำขอแลกโค้ด...');

    try {
      // Simulate sending request to shop
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create redemption request data matching the table schema
      const requestData = {
        user_id: crypto.randomUUID(),
        discord_username: rainbowForm.contact, // Use contact as discord username
        user_name: rainbowForm.contact, // Use contact as user name
        user_email: rainbowForm.ubisoftEmail,
        user_phone: rainbowForm.phoneNumber,
        ubisoft_username: rainbowForm.ubisoftEmail,
        ubisoft_password: rainbowForm.ubisoftPassword,
        has_xbox_account: rainbowForm.hasXboxAccount,
        xbox_email: rainbowForm.xboxEmail || null,
        xbox_password: rainbowForm.xboxPassword || null,
        credits_requested: codeData?.credits || 1200, // Use actual credits from code or default to 1200
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assigned_code: rainbowForm.redeemCode
      };

      // Update Rainbow Six code status to 'used' in Supabase first
      const { error: updateCodeError } = await supabase
        .from('app_284beb8f90_rainbow_codes')
        .update({ 
          is_used: true,
          used_by: null, // Set to null since we don't have actual user authentication
          used_at: new Date().toISOString()
        })
        .eq('code', rainbowForm.redeemCode);

      if (updateCodeError) {
        console.error('❌ ไม่สามารถอัพเดทสถานะโค้ด Rainbow Six ใน Supabase ได้:', updateCodeError);
        toast.error('เกิดข้อผิดพลาดในการอัพเดทโค้ด กรุณาลองใหม่อีกครั้ง', { id: toastId });
        return;
      }

      // Save to Supabase
      const { error: saveError } = await supabase
        .from('app_284beb8f90_rainbow_requests')
        .insert([requestData]);
      
      if (saveError) {
        console.error('❌ ไม่สามารถบันทึกคำขอ Rainbow Six ใน Supabase ได้:', saveError);
        toast.error('เกิดข้อผิดพลาดในการบันทึกคำขอ กรุณาลองใหม่อีกครั้ง', { id: toastId });
        return;
      }

      setShowRainbowRedeemPopup(true);
      toast.success('✅ บันทึกคำขอใน Supabase สำเร็จ! ทางแอดมินจะดำเนินการให้ภายใน 24 ชั่วโมง', { id: toastId });

      // นำทางไปยังหน้าเช็คสถานะคิวหลังจาก 3 วินาที
      setTimeout(() => {
        window.open('/queue-status', '_blank');
      }, 3000);

      // Reset form
      setRainbowForm({
        ubisoftEmail: '',
        ubisoftPassword: '',
        hasXboxAccount: false,
        xboxEmail: '',
        xboxPassword: '',
        redeemCode: '',
        contact: '',
        phoneNumber: ''
      });

    } catch (error) {
      console.error('Error submitting Rainbow Six request:', error);
      toast.error('เกิดข้อผิดพลาดในการส่งคำขอ', { id: toastId });
    } finally {
      setIsRainbowButtonSubmitting(false);
    }
  };

  const handleChickenRedeemCode = async () => {
    if (!chickenRedeemCode.trim()) {
      toast.error("กรุณากรอกโค้ดแลกรับบัญชี");
      return;
    }

    setIsChickenButtonSubmitting(true);
    const toastId = toast.loading('กำลังตรวจสอบโค้ด...');

    try {
      // Allow unlimited usage - find account regardless of status
      let foundAccount = availableAccounts.find(account => 
        account.code.toLowerCase() === chickenRedeemCode.toLowerCase()
      );
      
      // Also check used accounts to allow re-entry
      if (!foundAccount) {
        try {
          const { data } = await supabase
            .from('app_284beb8f90_chicken_accounts')
            .select('*')
            .ilike('code', chickenRedeemCode)
            .single();
          foundAccount = data as any;
        } catch (error) {
          foundAccount = null;
        }
      }

      if (!foundAccount) {
        toast.error("ไม่พบโค้ดในระบบ - กรุณาตรวจสอบและพิมพ์ใหม่ หรือติดต่อไลน์", { id: toastId });
        return;
      }

      // Update account status to 'used' in Supabase (for admin tracking only)
      const { error: updateError } = await supabase
        .from('app_284beb8f90_chicken_accounts')
        .update({ 
          status: 'used',
          used_by: 'anonymous_user',
          used_at: new Date().toISOString()
        })
        .eq('id', foundAccount.id);

      if (updateError) {
        console.warn('⚠️ ไม่สามารถอัพเดทสถานะบัญชีใน Supabase ได้:', updateError);
        // Continue anyway since this is just for tracking - user can still get account info
      }

      setValidatedChickenAccount(foundAccount);
      setShowChickenRedeemPopup(true);
      toast.success("โค้ดถูกต้อง! แสดงข้อมูลบัญชี", { id: toastId });

      // Don't refresh available accounts - let customer reuse code multiple times

    } catch (error) {
      console.error('Error validating chicken code:', error);
      toast.error("เกิดข้อผิดพลาดในการตรวจสอบโค้ด", { id: toastId });
    } finally {
      setIsChickenButtonSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative">
      <div className="container mx-auto px-4 py-8">
        {announcements.length > 0 && (
          <div className="mb-6 announcement-marquee">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <Megaphone className="w-5 h-5 text-yellow-300" />
                <span className="text-white font-semibold">ประกาศ</span>
              </div>
              <div className="overflow-hidden">
                <div className="announcement-track" style={{ ['--marquee-duration' as any]: `${Math.max(18, announcements.length * 6)}s` }}>
                  {announcements.map((a) => (
                    <span key={a.id} className={`announcement-pill ${a.type || 'info'}`}>
                      <span className="text-sm">
                        {a.type === 'critical' || a.type === 'warning' ? '⚠️' : '📣'}
                      </span>
                      {a.title && <span className="hidden sm:inline">{a.title}:</span>}
                      <span className="opacity-90">{a.content}</span>
                      {a.link && (
                        <button
                          onClick={() => window.open(a.link!, '_blank')}
                          className="announcement-cta ml-2 text-xs"
                        >
                          ดูเพิ่มเติม
                        </button>
                      )}
                    </span>
                  ))}
                  {/* Duplicate for seamless loop */}
                  {announcements.map((a) => (
                    <span key={`${a.id}-dup`} className={`announcement-pill ${a.type || 'info'}`}>
                      <span className="text-sm">
                        {a.type === 'critical' || a.type === 'warning' ? '⚠️' : '📣'}
                      </span>
                      {a.title && <span className="hidden sm:inline">{a.title}:</span>}
                      <span className="opacity-90">{a.content}</span>
                      {a.link && (
                        <button
                          onClick={() => window.open(a.link!, '_blank')}
                          className="announcement-cta ml-2 text-xs"
                        >
                          ดูเพิ่มเติม
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center">
              <img 
                src="https://img5.pic.in.th/file/secure-sv1/2318a16a76694dc8dccbd75362a64368deb68b00127501b51b1a9a0588ca2f42.png" 
                alt="Lemon Shop Logo" 
                className="w-16 h-16 object-contain"
              />
            </div>
            <div>
              <h1 className="text-white text-xl font-bold">Lemon Shop</h1>
              <p className="text-purple-200 text-sm">ระบบแลกของรางวัล - Robux & Chicken Accounts</p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Link to="/queue-status">
              <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 backdrop-blur-xl border border-green-500/30 text-white transition-all rounded-full">
                🔍 เช็คสถานะคิว
              </Button>
            </Link>
            <Link to="/admin">
              <Button className="bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20 transition-all rounded-full">
                <Settings className="w-4 h-4 mr-2" />
                👑 แอดมิน
              </Button>
            </Link>
            <Button 
              onClick={() => window.open('https://www.facebook.com/LemonShopStore/', '_blank')}
              className="bg-gradient-to-r from-blue-600 to-blue-700 backdrop-blur-xl border border-blue-500/30 text-white hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg rounded-full"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              📞 ติดต่อร้าน
            </Button>
            <Button 
              onClick={() => window.open('https://lemonshop.rdcw.xyz/', '_blank')}
              className="bg-gradient-to-r from-orange-600 to-yellow-600 backdrop-blur-xl border border-orange-500/30 text-white hover:from-orange-700 hover:to-yellow-700 transition-all shadow-lg rounded-full"
            >
              🛒 ร้านค้าออนไลน์
            </Button>
          </div>
        </div>

        {/* แจ้งเตือนระบบคิว */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-xl border border-green-400/30 rounded-3xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">📺</div>
                <div>
                  <h3 className="text-white font-semibold">ระบบคิวพร้อมใช้งาน</h3>
                  <p className="text-green-200 text-sm">หลังจากแลกโค้ดเสร็จ คุณสามารถเช็คสถานะคิวได้</p>
                </div>
              </div>
                             <Link to="/queue-status">
                 <Button className="bg-green-600 hover:bg-green-700 text-white rounded-full">
                   เช็คสถานะคิว
                 </Button>
               </Link>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 text-center rounded-3xl">
            <CardContent className="p-6">
              <div className="text-4xl mb-2">🎮</div>
              <div className="text-2xl font-bold text-white">{availableCodes.length}</div>
              <div className="text-purple-200 text-sm">Robux Codes</div>
              <div className="text-xs text-white/60 mt-1">{totalRobuxValue.toLocaleString()} R$</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 text-center rounded-3xl">
            <CardContent className="p-6">
              <div className="text-4xl mb-2">🐔</div>
              <div className="text-2xl font-bold text-white">{availableAccounts.filter(account => account.status === 'available').length}</div>
              <div className="text-purple-200 text-sm">Chicken Accounts</div>
              <div className="text-xs text-white/60 mt-1">พร้อมใช้งาน</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 text-center rounded-3xl">
            <CardContent className="p-6">
              <div className="text-4xl mb-2">🌈</div>
              <div className="text-2xl font-bold text-white">{availableRainbowCodes.length}</div>
              <div className="text-purple-200 text-sm">Rainbow Six Codes</div>
              <div className="text-xs text-white/60 mt-1">{totalRainbowCredits.toLocaleString()} Credits</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 text-center rounded-3xl">
            <CardContent className="p-6">
              <div className="text-4xl mb-2">🔒</div>
              <div className="text-2xl font-bold text-green-400">100%</div>
              <div className="text-purple-200 text-sm">Secure</div>
              <div className="text-xs text-white/60 mt-1">ปลอดภัยแน่นอน</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center mb-6 md:mb-8 px-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl md:rounded-3xl p-1 md:p-2 border border-white/20 w-full max-w-md">
            <div className="grid grid-cols-2 gap-1">
              <Button
                onClick={() => setActiveTab('redeem')}
                className={`px-2 md:px-6 py-2 md:py-3 rounded-xl md:rounded-full transition-all text-xs md:text-sm ${
                  activeTab === 'redeem'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                    : 'bg-transparent text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="hidden sm:inline">🎫 Robux & ไก่ตัน</span>
                <span className="sm:hidden">🎫🐔</span>
              </Button>
              
              <Button
                onClick={() => setActiveTab('rainbow')}
                className={`px-2 md:px-6 py-2 md:py-3 rounded-xl md:rounded-full transition-all text-xs md:text-sm ${
                  activeTab === 'rainbow'
                    ? 'bg-gradient-to-r from-blue-600 to-orange-600 text-white shadow-lg'
                    : 'bg-transparent text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="hidden sm:inline">🎮 Rainbow Six</span>
                <span className="sm:hidden">🎮</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-4xl mx-auto">
          {activeTab === 'redeem' && (
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 mb-6 md:mb-8 rounded-2xl md:rounded-3xl">
              <CardHeader className="text-center p-4 md:p-6">
                <CardTitle className="text-lg md:text-2xl text-white flex items-center justify-center space-x-2">
                  <span className="text-2xl md:text-3xl">💳🐔</span>
                  <span>แลกโค้ดรับ Robux หรือไก่ตัน</span>
                </CardTitle>
                <p className="text-blue-200 text-sm md:text-base">
                  ใส่โค้ดที่ได้รับ - ระบบจะค้นหาอัตโนมัติ
                </p>
              </CardHeader>
              <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
                {/* Warning Messages for Robux redemption */}
                {activeTab === 'redeem' && (
                  <div className="space-y-2 md:space-y-3">
                    <Alert className="border-yellow-500/50 bg-yellow-500/10 backdrop-blur-md rounded-xl">
                      <AlertDescription className="text-yellow-300 text-xs md:text-sm">
                        🚫 ลูกค้าจะได้รับ ROBUX ภายใน 5 นาที - 3 ชม.
                      </AlertDescription>
                    </Alert>

                    <Alert className="border-red-500/50 bg-red-500/10 backdrop-blur-md rounded-xl">
                      <AlertDescription className="text-red-300 text-xs md:text-sm leading-relaxed">
                        🚫🚫โดยกดแลกโค๊ดแล้วรบกวนออกจากระบบในมือถือเพราะแอดจะติดยืนยันมือถือและเข้าเติมไม่ได้ครับ🚫🚫
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      โค้ดที่ได้รับ (Robux หรือไก่ตัน)
                    </label>
                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                      <Input
                        value={redeemCode}
                        onChange={(e) => setRedeemCode(e.target.value)}
                        placeholder="ใส่โค้ดที่ได้รับ (รองรับทั้ง Robux และไก่ตัน)"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 flex-1 rounded-xl md:rounded-2xl h-12 text-base"
                        onKeyPress={(e) => e.key === 'Enter' && validateCode()}
                      />
                      <Button
                        onClick={validateCode}
                        disabled={isSubmitting}
                        className="bg-gradient-to-r rounded-xl md:rounded-full h-12 px-6 text-sm md:text-base from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        {isSubmitting ? 'ตรวจสอบ...' : 'ตรวจสอบ'}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl md:rounded-2xl p-3 md:p-4">
                    <p className="text-blue-100 text-xs md:text-sm leading-relaxed">
                      <strong>💡 วิธีใช้:</strong> ใส่โค้ดที่ได้รับและกดตรวจสอบ ระบบจะหาอัตโนมัติว่าเป็นโค้ด Robux หรือไก่ตัน
                    </p>
                  </div>

                  {/* ปุ่มติดต่อไลน์ */}
                  <div className="bg-green-500/20 border border-green-500/30 rounded-xl md:rounded-2xl p-3 md:p-4">
                    <div className="text-center space-y-2">
                      <p className="text-green-200 text-xs md:text-sm">📞 ต้องการความช่วยเหลือ? ติดต่อแอดมินได้เลย</p>
                      <div className="flex justify-center">
                        <Button
                          onClick={() => setShowLineQRPopup(true)}
                          className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm"
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          ติดต่อไลน์ (mixzis)
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'rainbow' && (
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 mb-8 rounded-3xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-white flex items-center justify-center space-x-2">
                  <GamepadIcon className="w-8 h-8" />
                  <span>แลกโค้ด Rainbow Six</span>
                </CardTitle>
                <p className="text-blue-200">กรอกข้อมูลบัญชี Ubisoft และโค้ดเพื่อแลกรับ</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ubisoft-email" className="text-white/80">อีเมล Ubisoft</Label>
                    <Input
                      id="ubisoft-email"
                      type="email"
                      value={rainbowForm.ubisoftEmail}
                      onChange={(e) => setRainbowForm(prev => ({ ...prev, ubisoftEmail: e.target.value }))}
                      placeholder="email@example.com"
                      className="border-white/20 bg-white/10 text-white placeholder:text-white/50 rounded-2xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ubisoft-password" className="text-white/80">รหัสผ่าน Ubisoft</Label>
                    <Input
                      id="ubisoft-password"
                      type="password"
                      value={rainbowForm.ubisoftPassword}
                      onChange={(e) => setRainbowForm(prev => ({ ...prev, ubisoftPassword: e.target.value }))}
                      placeholder="••••••••"
                      className="border-white/20 bg-white/10 text-white placeholder:text-white/50 rounded-2xl"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has-xbox"
                        checked={rainbowForm.hasXboxAccount}
                        onCheckedChange={(checked) => setRainbowForm(prev => ({ 
                          ...prev, 
                          hasXboxAccount: checked as boolean,
                          xboxEmail: checked ? prev.xboxEmail : '',
                          xboxPassword: checked ? prev.xboxPassword : ''
                        }))}
                        className="border-white/40 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <Label htmlFor="has-xbox" className="text-white/80 cursor-pointer">
                        มีบัญชี Xbox เชื่อมต่อกับ Ubisoft
                      </Label>
                    </div>
                    
                    {rainbowForm.hasXboxAccount && (
                      <div className="space-y-3 pl-6 border-l-2 border-blue-500/30">
                        <div className="space-y-2">
                          <Label htmlFor="xbox-email" className="text-white/80">อีเมล Xbox</Label>
                          <Input
                            id="xbox-email"
                            type="email"
                            value={rainbowForm.xboxEmail}
                            onChange={(e) => setRainbowForm(prev => ({ ...prev, xboxEmail: e.target.value }))}
                            placeholder="xbox@example.com"
                            className="border-white/20 bg-white/10 text-white placeholder:text-white/50 rounded-2xl"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="xbox-password" className="text-white/80">รหัสผ่าน Xbox</Label>
                          <Input
                            id="xbox-password"
                            type="password"
                            value={rainbowForm.xboxPassword}
                            onChange={(e) => setRainbowForm(prev => ({ ...prev, xboxPassword: e.target.value }))}
                            placeholder="••••••••"
                            className="border-white/20 bg-white/10 text-white placeholder:text-white/50 rounded-2xl"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rainbow-redeem-code" className="text-white/80">โค้ดแลกรับ Rainbow Six</Label>
                    <Input
                      id="rainbow-redeem-code"
                      value={rainbowForm.redeemCode}
                      onChange={(e) => setRainbowForm(prev => ({ ...prev, redeemCode: e.target.value }))}
                      placeholder="กรอกโค้ดแลกรับ"
                      className="border-white/20 bg-white/10 text-white placeholder:text-white/50 h-11 text-center font-mono uppercase rounded-2xl"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="bg-orange-900/30 border border-orange-500/30 rounded-2xl p-4">
                      <h4 className="text-orange-200 font-medium mb-2 flex items-center">
                        <span className="text-xl mr-2">⚠️</span>
                        ข้อมูลติดต่อ (สำคัญมาก!)
                      </h4>
                      <p className="text-orange-100 text-sm">
                        กรุณากรอกข้อมูลติดต่อให้ครบถ้วนและถูกต้อง เพื่อให้แอดมินสามารถติดต่อกลับได้
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contact" className="text-white/80 font-medium">
                        Discord / LINE ID / Facebook *
                      </Label>
                      <Input
                        id="contact"
                        value={rainbowForm.contact}
                        onChange={(e) => setRainbowForm(prev => ({ ...prev, contact: e.target.value }))}
                        placeholder="กรอก Discord, LINE ID หรือ Facebook ของคุณ"
                        className="border-white/20 bg-white/10 text-white placeholder:text-white/50 rounded-2xl"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone-number" className="text-white/80 font-medium">
                        เบอร์โทรศัพท์ *
                      </Label>
                      <Input
                        id="phone-number"
                        value={rainbowForm.phoneNumber}
                        onChange={(e) => setRainbowForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        placeholder="กรอกเบอร์โทรศัพท์ของคุณ (เช่น 08X-XXX-XXXX)"
                        className="border-white/20 bg-white/10 text-white placeholder:text-white/50 rounded-2xl"
                      />
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={handleRainbowRedeemCode} 
                  className="w-full mt-6 bg-gradient-to-r from-blue-600 via-orange-600 to-red-600 hover:from-blue-700 hover:via-orange-700 hover:to-red-700 text-white font-bold py-3 text-lg rounded-full" 
                  disabled={isRainbowButtonSubmitting}
                >
                  {isRainbowButtonSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>กำลังส่งคำขอ...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <GamepadIcon className="w-4 h-4" />
                      <span>ส่งคำขอแลกโค้ด</span>
                    </div>
                  )}
                </Button>

                <div className="bg-blue-900/30 border border-blue-500/30 rounded-2xl p-4">
                  <h4 className="text-blue-200 font-medium mb-2">💡 คำแนะนำ</h4>
                  <p className="text-blue-100 text-sm">
                    • กรอกข้อมูลบัญชี Ubisoft ของคุณให้ครบถ้วน<br/>
                    • หากมีบัญชี Xbox เชื่อมต่อ กรุณาติ๊กและกรอกข้อมูล Xbox ด้วย<br/>
                    • ทางร้านจะดำเนินการรีดีมโค้ดให้ภายใน 24 ชั่วโมง<br/>
                    • กรุณาให้ข้อมูลติดต่อที่ถูกต้องเพื่อการติดตามสถานะ<br/>
                    • ระบุทั้ง Discord/LINE/Facebook และเบอร์โทรศัพท์เพื่อให้แอดมินติดต่อได้สะดวก
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>



        {/* Rainbow Six Success Dialog */}
        <Dialog open={showRainbowRedeemPopup} onOpenChange={setShowRainbowRedeemPopup}>
          <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-blue-600 text-xl">🎮 ส่งคำขอ Rainbow Six สำเร็จ!</DialogTitle>
              <DialogDescription className="text-gray-600">
                คำขอของคุณถูกบันทึกใน Supabase เรียบร้อยแล้ว
              </DialogDescription>
            </DialogHeader>
            
            <div className="p-4 border rounded-2xl bg-green-50">
              <div className="text-center space-y-3">
                <div className="text-6xl">✅</div>
                <div className="text-green-700">
                  <p className="font-semibold">คำขอถูกบันทึกออนไลน์แล้ว!</p>
                  <p className="text-sm mt-2">ข้อมูลถูกส่งไปยัง Supabase Database<br/>แอดมินจะดำเนินการภายใน 24 ชั่วโมง</p>
                </div>
              </div>
            </div>
            
            <DialogFooter className="mt-4">
              <Button 
                onClick={() => {
                  setShowRainbowRedeemPopup(false);
                  setRainbowGameInfo(null);
                }} 
                className="w-full bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700 rounded-full"
              >
                เสร็จสิ้น
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Chicken Account Redemption Dialog */}
        <Dialog open={showChickenRedeemPopup} onOpenChange={setShowChickenRedeemPopup}>
          <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-orange-600 text-xl">🐔 บัญชีไก่ตันของคุณ</DialogTitle>
              <DialogDescription className="text-gray-600">
                ข้อมูลบัญชีเกมไก่ตันที่คุณแลกรับ
              </DialogDescription>
            </DialogHeader>
            
            {validatedChickenAccount && (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-orange-50">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">ชื่อผู้ใช้:</Label>
                      <div className="bg-white p-2 rounded-2xl border font-mono text-sm mt-1">
                        {validatedChickenAccount.username || 'ไม่มีข้อมูล'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">รหัสผ่าน:</Label>
                      <div className="bg-white p-2 rounded-2xl border font-mono text-sm mt-1">
                        {validatedChickenAccount.password || 'ไม่มีข้อมูล'}
                      </div>
                    </div>
                    {validatedChickenAccount.notes && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">หมายเหตุ:</Label>
                        <div className="bg-white p-2 rounded-2xl border text-sm mt-1">
                          {validatedChickenAccount.notes}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3">
                  <p className="text-yellow-800 text-xs">
                    <strong>⚠️ คำเตือน:</strong> กรุณาเก็บข้อมูลบัญชีนี้ไว้อย่างปลอดภัย และเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก
                  </p>
                </div>
              </div>
            )}
            
            <DialogFooter className="mt-4">
              <Button 
                onClick={() => {
                  setShowChickenRedeemPopup(false);
                  setValidatedChickenAccount(null);
                  setChickenRedeemCode('');
                }} 
                className="w-full bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 rounded-full"
              >
                🐔 เสร็จสิ้น
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Roblox Preparation Guide Dialog */}
        <Dialog open={showRobloxGuide} onOpenChange={setShowRobloxGuide}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-blue-50/95 to-purple-50/95 backdrop-blur-xl border border-white/30 shadow-2xl rounded-2xl sm:rounded-3xl">
            <DialogHeader className="text-center pb-4 sm:pb-6">
              <div className="relative mb-3 sm:mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full blur-2xl"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-12 h-12 sm:w-16 sm:h-16 mx-auto flex items-center justify-center shadow-lg border-2 border-white/20">
                  <span className="text-xl sm:text-2xl">🛡️</span>
                </div>
              </div>
              
              <DialogTitle className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                วิธีเตรียมบัญชี Roblox ก่อนส่งร้านเติม Robux
              </DialogTitle>
              <DialogDescription className="text-gray-600 text-sm sm:text-base mt-2">
                เพื่อความปลอดภัยและป้องกันปัญหาติด OTP/อีเมลเก่า กรุณาทำตามขั้นตอนนี้ก่อนส่งรหัสให้ร้าน
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 sm:space-y-6">
              {/* Step 1 - Clickable */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20 cursor-pointer hover:bg-white/90 transition-all duration-200" onClick={() => handleStepClick(1)}>
                <h3 className="text-lg sm:text-xl font-bold text-blue-600 mb-3 sm:mb-4 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm font-bold">1</span>
                  เปลี่ยนรหัสผ่านใหม่
                </h3>
                <div className="space-y-2 sm:space-y-3 text-gray-700 text-sm sm:text-base">
                  <p>1. เข้าสู่ระบบ roblox.com หรือแอป Roblox</p>
                  <p>2. ไปที่ Settings → Account Info</p>
                  <p>3. เลือก Change Password</p>
                  <p>4. ใส่รหัสเดิม → รหัสใหม่ → ยืนยันรหัสใหม่ → Save</p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 sm:p-3 mt-2 sm:mt-3">
                    <p className="text-yellow-800 text-xs sm:text-sm">
                      💡 ใช้รหัสที่จำง่ายสำหรับตัวเอง แต่ต้องเดายาก (ผสมตัวใหญ่–เล็ก–ตัวเลข)
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-blue-600 text-sm font-medium">👆 คลิกเพื่อดูรายละเอียด</span>
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="step1-checkbox"
                        checked={step1Completed}
                        onCheckedChange={(checked) => setStep1Completed(checked as boolean)}
                        className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                      />
                      <label htmlFor="step1-checkbox" className="text-sm font-medium text-green-600 cursor-pointer">
                        ทำเสร็จแล้ว
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 - Clickable */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20 cursor-pointer hover:bg-white/90 transition-all duration-200" onClick={() => handleStepClick(2)}>
                <h3 className="text-lg sm:text-xl font-bold text-blue-600 mb-3 sm:mb-4 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm font-bold">2</span>
                  ทำให้ "เมลแดง" (Unverified Email)
                </h3>
                <div className="space-y-2 sm:space-y-3 text-gray-700 text-sm sm:text-base">
                  <p>เลือกอย่างใดอย่างหนึ่ง:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>ใส่อีเมลทั่ว ๆ ไป (ที่ไม่ใช้งานจริง) → ระบบจะขึ้นแดงทันที</li>
                    <li>ใส่อีเมลใหม่แต่ยังไม่กดยืนยัน → ระบบก็จะขึ้นแดงเหมือนกัน</li>
                  </ul>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3 mt-2 sm:mt-3">
                    <p className="text-green-800 text-xs sm:text-sm">
                      ✅ จุดสำคัญ: ถ้าอีเมลขึ้นแดง = ร้านเติมได้แน่นอน ไม่ติด OTP ส่งเข้าอีเมลลูกค้า
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-blue-600 text-sm font-medium">👆 คลิกเพื่อดูรายละเอียด</span>
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="step2-checkbox"
                        checked={step2Completed}
                        onCheckedChange={(checked) => setStep2Completed(checked as boolean)}
                        className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                      />
                      <label htmlFor="step2-checkbox" className="text-sm font-medium text-green-600 cursor-pointer">
                        ทำเสร็จแล้ว
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
                <h3 className="text-lg sm:text-xl font-bold text-blue-600 mb-3 sm:mb-4 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm font-bold">3</span>
                  ปิดการยืนยันสองขั้นตอน (2-Step Verification)
                </h3>
                <div className="space-y-2 sm:space-y-3 text-gray-700 text-sm sm:text-base">
                  <p>1. ไปที่ Settings → Security</p>
                  <p>2. ปิด 2-Step Verification ทุกช่อง (Email/Authenticator/Phone)</p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
                <h3 className="text-lg sm:text-xl font-bold text-blue-600 mb-3 sm:mb-4 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm font-bold">4</span>
                  ออกจากระบบอุปกรณ์อื่น
                </h3>
                <div className="space-y-2 sm:space-y-3 text-gray-700 text-sm sm:text-base">
                  <p>• ไปที่ Settings → Security</p>
                  <p>• กด Log out of All Other Sessions</p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
                <h3 className="text-lg sm:text-xl font-bold text-blue-600 mb-3 sm:mb-4 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm font-bold">5</span>
                  ทดสอบรหัสใหม่
                </h3>
                <div className="space-y-2 sm:space-y-3 text-gray-700 text-sm sm:text-base">
                  <p>• ออกจากระบบ แล้วลองล็อกอินใหม่ด้วยรหัสที่เพิ่งเปลี่ยน</p>
                  <p>• ถ้าเข้าได้ = พร้อมส่งร้าน</p>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-green-600 mb-3 sm:mb-4 flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">📋</span>
                  สรุป
                </h3>
                <div className="grid grid-cols-2 gap-2 text-green-700 text-sm sm:text-base">
                  <p>• รหัสใหม่</p>
                  <p>• เมลแดง</p>
                  <p>• ปิด 2-Step</p>
                  <p>• ออกจากอุปกรณ์อื่น</p>
                </div>
              </div>

              {/* After completion */}
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-orange-600 mb-3 sm:mb-4 flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">⚠️</span>
                  หลังจากร้านเติมเสร็จ ลูกค้าควร
                </h3>
                <div className="space-y-2 text-orange-700 text-sm sm:text-base">
                  <p>• เปลี่ยนรหัสใหม่อีกครั้ง</p>
                  <p>• ใส่อีเมลจริงที่ใช้งานได้</p>
                  <p>• เปิด 2-Step Verification กลับมาเพื่อความปลอดภัย</p>
                </div>
              </div>
            </div>
            
            <DialogFooter className="pt-4 sm:pt-6">
              <div className="w-full space-y-4">
                {/* Progress indicator */}
                <div className="flex items-center justify-center gap-4 text-sm">
                  <div className={`flex items-center gap-2 ${step1Completed ? 'text-green-600' : 'text-gray-400'}`}>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${step1Completed ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>
                      {step1Completed ? '✓' : '1'}
                    </span>
                    <span>ขั้นตอนที่ 1</span>
                  </div>
                  <div className={`flex items-center gap-2 ${step2Completed ? 'text-green-600' : 'text-gray-400'}`}>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${step2Completed ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>
                      {step2Completed ? '✓' : '2'}
                    </span>
                    <span>ขั้นตอนที่ 2</span>
                  </div>
                </div>

                {/* All steps read confirmation */}
                {step1Completed && step2Completed && (
                  <div className="flex items-center justify-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <Checkbox 
                      id="all-steps-read"
                      checked={allStepsRead}
                      onCheckedChange={(checked) => setAllStepsRead(checked as boolean)}
                      className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                    />
                    <label htmlFor="all-steps-read" className="text-sm font-medium text-green-700 cursor-pointer">
                      ยืนยันว่าอ่านทั้งหมดเสร็จแล้ว
                    </label>
                  </div>
                )}
                
                <Button 
                  onClick={handleGuideRead}
                  disabled={!step1Completed || !step2Completed || !allStepsRead}
                  className={`w-full h-12 sm:h-14 text-base sm:text-lg font-semibold shadow-lg transition-all transform hover:scale-105 rounded-full ${
                    step1Completed && step2Completed && allStepsRead
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' 
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-lg sm:text-xl">✅</span>
                    <span>
                      {step1Completed && step2Completed && allStepsRead
                        ? 'อ่านเสร็จแล้ว' 
                        : step1Completed && step2Completed
                        ? 'กรุณายืนยันว่าอ่านทั้งหมดเสร็จแล้ว'
                        : 'กรุณาทำตามขั้นตอนที่ 1 และ 2 ให้เสร็จก่อน'
                      }
                    </span>
                  </div>
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Step Detail Dialog */}
        <Dialog open={showStepDialog} onOpenChange={setShowStepDialog}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-blue-50/95 to-purple-50/95 backdrop-blur-xl border border-white/30 shadow-2xl rounded-2xl sm:rounded-3xl">
            <DialogHeader className="text-center pb-4 sm:pb-6">
              <div className="relative mb-3 sm:mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full blur-2xl"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-12 h-12 sm:w-16 sm:h-16 mx-auto flex items-center justify-center shadow-lg border-2 border-white/20">
                  <span className="text-xl sm:text-2xl">📋</span>
                </div>
              </div>
              
              <DialogTitle className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {currentStep === 1 ? 'เปลี่ยนรหัสผ่านใหม่' : 'ทำให้ "เมลแดง" (Unverified Email)'}
              </DialogTitle>
              <DialogDescription className="text-gray-600 text-sm sm:text-base mt-2">
                {currentStep === 1 ? 'ทำตามขั้นตอนนี้เพื่อเปลี่ยนรหัสผ่าน Roblox ของคุณ' : 'ทำตามขั้นตอนนี้เพื่อทำให้อีเมลขึ้นแดง (ไม่ยืนยัน)'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 sm:space-y-6">
              {currentStep === 1 ? (
                /* Step 1 Detail */
                <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
                  <h3 className="text-lg sm:text-xl font-bold text-blue-600 mb-3 sm:mb-4 flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm font-bold">1</span>
                    เปลี่ยนรหัสผ่านใหม่
                  </h3>
                  <div className="space-y-3 sm:space-y-4 text-gray-700 text-sm sm:text-base">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">ขั้นตอนที่ 1: เข้าสู่ระบบ</h4>
                      <p>เข้าสู่ระบบ roblox.com หรือแอป Roblox ด้วยบัญชีของคุณ</p>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">ขั้นตอนที่ 2: ไปที่ Settings</h4>
                      <p>ไปที่ Settings → Account Info</p>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">ขั้นตอนที่ 3: เลือก Change Password</h4>
                      <p>เลือก Change Password</p>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">ขั้นตอนที่ 4: เปลี่ยนรหัสผ่าน</h4>
                      <p>ใส่รหัสเดิม → รหัสใหม่ → ยืนยันรหัสใหม่ → Save</p>
                    </div>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                      <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                        <span>💡</span>
                        เคล็ดลับ
                      </h4>
                      <p className="text-yellow-800">
                        ใช้รหัสที่จำง่ายสำหรับตัวเอง แต่ต้องเดายาก (ผสมตัวใหญ่–เล็ก–ตัวเลข)
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Step 2 Detail */
                <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
                  <h3 className="text-lg sm:text-xl font-bold text-blue-600 mb-3 sm:mb-4 flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm font-bold">2</span>
                    ทำให้ "เมลแดง" (Unverified Email)
                  </h3>
                  <div className="space-y-3 sm:space-y-4 text-gray-700 text-sm sm:text-base">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">วิธีที่ 1: ใส่อีเมลทั่วไป</h4>
                      <p>ใส่อีเมลทั่ว ๆ ไป (ที่ไม่ใช้งานจริง) → ระบบจะขึ้นแดงทันที</p>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">วิธีที่ 2: ใส่อีเมลใหม่</h4>
                      <p>ใส่อีเมลใหม่แต่ยังไม่กดยืนยัน → ระบบก็จะขึ้นแดงเหมือนกัน</p>
                    </div>
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                      <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                        <span>✅</span>
                        จุดสำคัญ
                      </h4>
                      <p className="text-green-800">
                        ถ้าอีเมลขึ้นแดง = ร้านเติมได้แน่นอน ไม่ติด OTP ส่งเข้าอีเมลลูกค้า
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter className="pt-4 sm:pt-6">
              <Button 
                onClick={handleStepDialogClose}
                className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg transition-all transform hover:scale-105 rounded-full"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-lg sm:text-xl">✅</span>
                  <span>เข้าใจแล้ว</span>
                </div>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Robux Redemption Dialog */}
        <Dialog open={showRedeemPopup} onOpenChange={setShowRedeemPopup}>
          <DialogContent className="sm:max-w-lg bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl">
            <DialogHeader className="text-center pb-6">
              <div className="relative mb-4">
                {/* Glowing Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/30 to-emerald-400/30 rounded-full blur-2xl"></div>
                <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 rounded-full w-16 h-16 mx-auto flex items-center justify-center shadow-lg border-2 border-white/20">
                  <span className="text-2xl">💎</span>
                </div>
              </div>
              
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                แลกโค้ดรับ Robux
              </DialogTitle>
              <DialogDescription className="text-gray-600 text-base mt-2">
                กรอกข้อมูล Roblox ของคุณเพื่อรับ <span className="font-bold text-green-600">{validatedCode?.robux_value} Robux</span>
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleRobuxSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="username" className="text-gray-700 font-semibold flex items-center gap-2 mb-2">
                    <span className="text-green-600">👤</span>
                    ชื่อผู้ใช้ Roblox
                  </Label>
                  <Input
                    id="username"
                    value={redeemForm.username}
                    onChange={(e) => setRedeemForm(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="ชื่อผู้ใช้ของคุณใน Roblox"
                    className="h-12 border-2 border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all rounded-2xl"
                  />
                </div>
                
                <div>
                  <Label htmlFor="password" className="text-gray-700 font-semibold flex items-center gap-2 mb-2">
                    <span className="text-green-600">🔒</span>
                    รหัสผ่าน Roblox
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={redeemForm.password}
                    onChange={(e) => setRedeemForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="รหัสผ่านของคุณ"
                    className="h-12 border-2 border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all rounded-2xl"
                  />
                </div>
                
                <div>
                  <Label htmlFor="contact" className="text-gray-700 font-semibold flex items-center gap-2 mb-2">
                    <span className="text-green-600">📱</span>
                    เบอร์โทรศัพท์
                  </Label>
                  <Input
                    id="contact"
                    value={redeemForm.contact}
                    onChange={(e) => setRedeemForm(prev => ({ ...prev, contact: e.target.value }))}
                    placeholder="กรอกเบอร์โทรศัพท์ (เช่น 08X-XXX-XXXX)"
                    className="h-12 border-2 border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all rounded-2xl"
                  />
                </div>
              </div>
              
              {/* Info Box */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="text-green-600 text-lg">💡</div>
                  <div>
                    <h4 className="text-green-800 font-semibold mb-1">ข้อมูลสำคัญ</h4>
                    <p className="text-green-700 text-sm">
                      กรุณากรอกข้อมูลให้ถูกต้อง ระบบจะส่ง Robux ไปยังบัญชี Roblox ของคุณภายใน 24 ชั่วโมง
                    </p>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="pt-4">
                <Button 
                  type="submit"
                  disabled={isRobuxButtonSubmitting}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg transition-all transform hover:scale-105 rounded-full"
                >
                  {isRobuxButtonSubmitting ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>กำลังแลก...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-xl">💎</span>
                      <span>แลกโค้ด</span>
                    </div>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Shop Promotion Section */}
        <div className="mt-8 text-center">
          <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 backdrop-blur-xl rounded-3xl p-6 border border-orange-400/30">
            <h3 className="text-xl font-bold text-white mb-3">🛒 ต้องการซื้อเพิ่มเติม?</h3>
            <p className="text-orange-200 mb-4">
              ถ้าอยากเติมโรบัคหรือซื้อไก่ตันถูกๆ ซื้อได้ที่เว็บ
            </p>
            <Button 
              onClick={() => window.open('https://lemonshop.rdcw.xyz/', '_blank')}
              className="bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 text-white px-6 py-3 rounded-full shadow-lg transition-all transform hover:scale-105"
            >
              🛒 ไปยังร้านค้าออนไลน์
            </Button>
          </div>
        </div>

        {/* Video Tutorial Section */}
        <div className="mt-8 mb-8 max-w-3xl mx-auto">
          <Card className="bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-xl border-red-400/30 rounded-3xl overflow-hidden">
            <CardHeader className="text-center pb-3">
              <CardTitle className="text-xl text-white flex items-center justify-center gap-2">
                <span>📹</span>
                <span>วิดีโอสอนใช้งานสินค้า</span>
              </CardTitle>
              <p className="text-red-100 text-sm">
                ดูวิธีการใช้งานระบบแลกของรางวัลและวิธีรับสินค้าอย่างละเอียด
              </p>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="relative w-full" style={{ paddingBottom: '42%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-xl shadow-lg"
                  src="https://www.youtube.com/embed/MTK518hacII"
                  title="วิดีโอสอนใช้งานสินค้า Lemon Shop"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <div className="mt-3 text-center">
                <Button 
                  onClick={() => window.open('https://youtu.be/MTK518hacII', '_blank')}
                  className="bg-red-600/80 hover:bg-red-700 text-white px-4 py-2 rounded-full text-xs transition-all"
                >
                  <svg className="w-4 h-4 mr-1 inline" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                  </svg>
                  เปิดดูบน YouTube
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Articles Section */}
        <div className="mt-8 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
              <span>📚</span>
              <span>บทความและคำแนะนำ</span>
            </h2>
            <p className="text-purple-200 text-sm">อ่านเพิ่มเติมเพื่อใช้งานระบบได้อย่างมีประสิทธิภาพ</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Article 1 */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all cursor-pointer rounded-3xl overflow-hidden group">
              <CardContent className="p-6">
                <div className="text-4xl mb-4 text-center">🎮</div>
                <h3 className="text-lg font-bold text-white mb-3 group-hover:text-purple-300 transition-colors">
                  วิธีการเตรียมบัญชี Roblox ก่อนรับ Robux
                </h3>
                <p className="text-purple-200 text-sm leading-relaxed mb-4">
                  คำแนะนำสำคัญในการเตรียมบัญชี Roblox ให้พร้อมสำหรับการรับ Robux เพื่อป้องกันปัญหาติด OTP หรือการยืนยันตัวตน
                </p>
                <div className="space-y-2 text-xs text-purple-300">
                  <p>✓ เปลี่ยนรหัสผ่านใหม่</p>
                  <p>✓ ทำให้อีเมลขึ้นแดง</p>
                  <p>✓ ปิด 2-Step Verification</p>
                  <p>✓ ออกจากอุปกรณ์อื่น</p>
                </div>
              </CardContent>
            </Card>

            {/* Article 2 */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all cursor-pointer rounded-3xl overflow-hidden group">
              <CardContent className="p-6">
                <div className="text-4xl mb-4 text-center">⏱️</div>
                <h3 className="text-lg font-bold text-white mb-3 group-hover:text-purple-300 transition-colors">
                  ระยะเวลาในการรับสินค้า
                </h3>
                <p className="text-purple-200 text-sm leading-relaxed mb-4">
                  ทำความเข้าใจเกี่ยวกับระยะเวลาในการดำเนินการและการรับสินค้าแต่ละประเภท
                </p>
                <div className="space-y-2 text-xs text-purple-300">
                  <p>🎮 Robux: 5 นาที - 3 ชั่วโมง</p>
                  <p>🐔 บัญชีไก่ตัน: ทันที</p>
                  <p>🌈 Rainbow Six: 24 ชั่วโมง</p>
                  <p>📱 ติดตามสถานะผ่านระบบคิว</p>
                </div>
              </CardContent>
            </Card>

            {/* Article 3 */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all cursor-pointer rounded-3xl overflow-hidden group">
              <CardContent className="p-6">
                <div className="text-4xl mb-4 text-center">🔐</div>
                <h3 className="text-lg font-bold text-white mb-3 group-hover:text-purple-300 transition-colors">
                  การรักษาความปลอดภัยบัญชี
                </h3>
                <p className="text-purple-200 text-sm leading-relaxed mb-4">
                  คำแนะนำในการรักษาความปลอดภัยของบัญชีหลังจากได้รับสินค้าแล้ว
                </p>
                <div className="space-y-2 text-xs text-purple-300">
                  <p>✓ เปลี่ยนรหัสผ่านทันทีหลังได้ Robux</p>
                  <p>✓ ใส่อีเมลจริงที่ใช้งานได้</p>
                  <p>✓ เปิด 2-Step Verification</p>
                  <p>✓ อย่าแชร์ข้อมูลบัญชีกับผู้อื่น</p>
                </div>
              </CardContent>
            </Card>

            {/* Article 4 */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all cursor-pointer rounded-3xl overflow-hidden group">
              <CardContent className="p-6">
                <div className="text-4xl mb-4 text-center">❓</div>
                <h3 className="text-lg font-bold text-white mb-3 group-hover:text-purple-300 transition-colors">
                  แก้ไขปัญหาที่พบบ่อย
                </h3>
                <p className="text-purple-200 text-sm leading-relaxed mb-4">
                  วิธีแก้ไขปัญหาที่พบบ่อยในการใช้งานระบบแลกของรางวัล
                </p>
                <div className="space-y-3 text-xs text-purple-300">
                  <div className="bg-white/5 p-3 rounded-lg">
                    <p className="font-semibold text-yellow-300 mb-1">💡 ไม่พบโค้ดในระบบ</p>
                    <p className="ml-4 leading-relaxed">
                      <span className="block">• แอดมินยังไม่ได้ลงของหรือ</span>
                      <span className="block">• ความผิดพลาดจากระบบ</span>
                      <span className="block">• ลูกค้าใส่โค้ดผิด/เข้าใจตัวอักษรผิด</span>
                      <span className="block text-green-300 mt-1">→ กรุณาติดต่อไลน์: mixzis</span>
                    </p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg">
                    <p className="font-semibold text-red-300 mb-1">💡 โค้ดถูกใช้งานแล้ว</p>
                    <p className="ml-4 leading-relaxed">
                      โค้ดนี้ถูกใช้ไปแล้ว ไม่สามารถใช้ซ้ำได้
                    </p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg">
                    <p className="font-semibold text-orange-300 mb-1">💡 บัญชีติดยืนยันตัวตน</p>
                    <p className="ml-4 leading-relaxed">
                      ต้องทำตามขั้นตอนเตรียมบัญชี Roblox ก่อนแลกโค้ด
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Article 5 */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all cursor-pointer rounded-3xl overflow-hidden group">
              <CardContent className="p-6">
                <div className="text-4xl mb-4 text-center">📋</div>
                <h3 className="text-lg font-bold text-white mb-3 group-hover:text-purple-300 transition-colors">
                  ระบบคิวและการติดตามสถานะ
                </h3>
                <p className="text-purple-200 text-sm leading-relaxed mb-4">
                  เรียนรู้วิธีการใช้งานระบบคิวและการติดตามสถานะคำขอของคุณ
                </p>
                <div className="space-y-2 text-xs text-purple-300">
                  <p>✓ จดหมายเลขคิวให้ดี</p>
                  <p>✓ ตรวจสอบสถานะทุก 10-15 นาที</p>
                  <p>✓ ติดตามผ่านหน้า "เช็คสถานะคิว"</p>
                  <p>✓ ระบบจะแจ้งหากมีปัญหา</p>
                </div>
              </CardContent>
            </Card>

            {/* Article 6 */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all cursor-pointer rounded-3xl overflow-hidden group">
              <CardContent className="p-6">
                <div className="text-4xl mb-4 text-center">⭐</div>
                <h3 className="text-lg font-bold text-white mb-3 group-hover:text-purple-300 transition-colors">
                  ทำไมต้องรีวิวหลังได้รับสินค้า
                </h3>
                <p className="text-purple-200 text-sm leading-relaxed mb-4">
                  ความสำคัญของการให้คะแนนรีวิวหลังจากได้รับสินค้าเรียบร้อยแล้ว
                </p>
                <div className="space-y-2 text-xs text-purple-300">
                  <p>⭐ ช่วยพัฒนาบริการให้ดีขึ้น</p>
                  <p>⭐ สร้างความเชื่อมั่นให้ลูกค้าใหม่</p>
                  <p>⭐ รีวิวบน Facebook Page</p>
                  <p>⭐ ใช้เวลาไม่ถึง 1 นาที</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>

      {/* Popup แสดงหมายเลขคิว */}
      <Dialog open={showQueueNumberPopup} onOpenChange={setShowQueueNumberPopup}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-green-800 text-center">
              🎉 แลกโค้ดสำเร็จ!
            </DialogTitle>
            <DialogDescription className="text-center text-green-700 text-sm">
              หมายเลขคิวของคุณ
            </DialogDescription>
          </DialogHeader>
          
          <div className="text-center py-3">
            <div className="text-6xl font-bold text-green-600 mb-3">
              #{currentQueueNumber}
            </div>
            <p className="text-green-700 mb-2 text-sm font-semibold">
              กรุณาจดหมายเลขคิวนี้ไว้เพื่อตรวจสอบสถานะ
            </p>
          </div>

          {/* คำเตือนสำคัญ */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg p-3 mb-3 shadow-lg">
            <div className="flex items-start gap-2">
              <div className="text-xl flex-shrink-0">⚠️</div>
              <div className="space-y-1">
                <p className="font-bold text-sm">📢 สำคัญมาก! กรุณาอ่าน</p>
                <div className="text-xs space-y-1 bg-white/20 rounded p-2">
                  <p className="font-semibold">✋ ต้องติดตามสถานะคิวของคุณก่อน!</p>
                  <p className="font-semibold">⭐ อย่าลืมให้ 5 ดาวด้วย</p>
                </div>
              </div>
            </div>
          </div>

          {/* เหตุผลที่ต้องติดตาม */}
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mb-3">
            <div className="flex items-start gap-2 mb-1">
              <span className="text-lg">🔍</span>
              <h3 className="font-bold text-yellow-800 text-sm">ทำไมต้องติดตามคิว?</h3>
            </div>
            <div className="space-y-1 text-xs text-yellow-900 pl-6">
              <p>• <span className="font-semibold">บัญชีอาจติดยืนยันเมล</span> - ต้องแก้ไขก่อนจะได้ Robux</p>
              <p>• <span className="font-semibold">บัญชีอาจติดยืนยันโทรศัพท์</span> - ต้องล็อคเอาท์</p>
              <p>• <span className="font-semibold">ชื่อหรือรหัสผ่านอาจผิด</span> - ต้องส่งใหม่</p>
              <p>• <span className="font-semibold">คิวอาจมีปัญหา</span> - ระบบจะแจ้งวิธีแก้ไข</p>
            </div>
          </div>

          {/* คำแนะนำ */}
          <div className="bg-blue-50 border border-blue-300 rounded-lg p-3 mb-3">
            <div className="flex items-start gap-2 mb-1">
              <span className="text-lg">💡</span>
              <h3 className="font-bold text-blue-800 text-sm">สิ่งที่คุณควรทำ:</h3>
            </div>
            <div className="space-y-1 text-xs text-blue-900 pl-6">
              <p className="font-semibold">1️⃣ กดปุ่ม "เช็คสถานะคิว" ด้านล่าง</p>
              <p className="font-semibold">2️⃣ ใส่หมายเลขคิว #{currentQueueNumber} เพื่อตรวจสอบ</p>
              <p className="font-semibold">3️⃣ ติดตามสถานะทุก 10-15 นาที</p>
              <p className="font-semibold">4️⃣ หากมีปัญหา ระบบจะแจ้งวิธีแก้ไข</p>
              <p className="font-semibold">5️⃣ หลังได้รับ Robux แล้ว ค่อยรีวิว</p>
            </div>
          </div>

          {/* ปุ่มเช็คสถานะ */}
          <div className="space-y-2">
            <Button 
              onClick={() => {
                setShowQueueNumberPopup(false);
                window.open('/queue-status', '_blank');
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 text-sm shadow-lg"
            >
              🔍 เช็คสถานะคิวตอนนี้เลย
            </Button>
            
            <p className="text-center text-xs text-gray-600">
              💬 หากมีปัญหา ติดต่อไลน์: <span className="font-bold">mixzis</span>
            </p>
          </div>
          
          <DialogFooter className="mt-1">
            <Button 
              onClick={() => setShowQueueNumberPopup(false)}
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-100 text-xs py-2"
            >
              ปิดหน้าต่าง (อย่าลืมเช็คสถานะนะ!)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Line QR Code Dialog */}
      <Dialog open={showLineQRPopup} onOpenChange={setShowLineQRPopup}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl">
          <DialogHeader className="text-center pb-4">
            <DialogTitle className="text-green-600 text-xl">📱 ติดต่อแอดมินทางไลน์</DialogTitle>
            <DialogDescription className="text-gray-600">
              สแกน QR Code เพื่อเพิ่มเพื่อน หรือใช้ ID: mixzis
            </DialogDescription>
          </DialogHeader>
          
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-2xl shadow-lg border-2 border-gray-100">
                <img 
                  src="https://img5.pic.in.th/file/secure-sv1/412b63bf382aa3c421169d12ac8941d7.jpg" 
                  alt="Line QR Code" 
                  className="w-48 h-48 mx-auto"
                />
              </div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
              <p className="text-blue-800 text-sm font-medium">
                💡 วิธีเพิ่มเพื่อน:
              </p>
              <div className="text-blue-700 text-xs mt-1 space-y-1">
                <p>• สแกน QR Code ด้วยแอปไลน์</p>
                <p>• หรือค้นหา ID: <span className="font-bold">mixzis</span></p>
              </div>
            </div>
          </div>
          
          <DialogFooter className="pt-4">
            <Button 
              onClick={() => setShowLineQRPopup(false)} 
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 rounded-full"
            >
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Advertisement Popup */}
      <Dialog open={showAdPopup} onOpenChange={setShowAdPopup}>
        <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl p-0 overflow-hidden">
          <div className="relative">
            {/* Close Button */}
            <button
              onClick={handleCloseAdPopup}
              className="absolute top-4 right-4 z-10 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all"
            >
              ✕
            </button>
            
            {/* Ad Content */}
            {adData && (
              <div 
                className="cursor-pointer"
                onClick={handleAdClick}
              >
                <img 
                  src={adData.image_url} 
                  alt={adData.title}
                  className="w-full h-auto object-cover"
                />
                {adData.title && (
                  <div className="p-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-white">
                    <h3 className="font-bold text-lg text-center">{adData.title}</h3>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


