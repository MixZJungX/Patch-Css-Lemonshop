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
    facebookName: '',
    lineId: ''
  });

  // Anti-spam / Code brute force protection
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownEndTime, setCooldownEndTime] = useState<number | null>(null);
  const [remainingCooldownTime, setRemainingCooldownTime] = useState<string>('');

  // ระบบคิว
  const [showQueueNumberPopup, setShowQueueNumberPopup] = useState(false);
  const [currentQueueNumber, setCurrentQueueNumber] = useState<number | null>(null);

  // Roblox preparation guide
  const [showRobloxGuide, setShowRobloxGuide] = useState(false);
  const [hasReadGuide, setHasReadGuide] = useState(false);
  const [step2Completed, setStep2Completed] = useState(false);
  const [step3Completed, setStep3Completed] = useState(false);
  
  // Prepare ID/Password guide popup
  const [showPrepareGuide, setShowPrepareGuide] = useState(false);
  
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
    
    // โหลดข้อมูล anti-spam จาก localStorage
    loadAntiSpamData();
    
    // ทดสอบการเชื่อมต่อระบบคิว
    testQueueConnection().then(isConnected => {
      if (!isConnected) {
        console.warn('⚠️ ระบบคิวไม่พร้อมใช้งาน - กรุณารัน SQL script ใน Supabase');
        toast.error('ระบบคิวไม่พร้อมใช้งาน กรุณาติดต่อแอดมิน');
      }
    });
  }, []);

  // อัปเดต countdown timer ทุกวินาที
  useEffect(() => {
    if (cooldownEndTime) {
      const interval = setInterval(() => {
        const now = Date.now();
        if (now >= cooldownEndTime) {
          // หมดเวลา cooldown
          resetCooldown();
        } else {
          // อัปเดตเวลาที่เหลือ
          const remaining = cooldownEndTime - now;
          const minutes = Math.floor(remaining / 60000);
          const seconds = Math.floor((remaining % 60000) / 1000);
          setRemainingCooldownTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [cooldownEndTime]);

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

  // ระบบป้องกันการสุ่มโค้ด (Anti-Brute Force)
  const STORAGE_KEY_ATTEMPTS = 'lemonshop_failed_attempts';
  const STORAGE_KEY_COOLDOWN = 'lemonshop_cooldown_end';
  const MAX_FAILED_ATTEMPTS = 10; // จำนวนครั้งสูงสุดที่ลองผิดได้
  const COOLDOWN_DURATION = 30 * 60 * 1000; // 30 นาที (ในหน่วย milliseconds)

  const loadAntiSpamData = () => {
    try {
      const attempts = localStorage.getItem(STORAGE_KEY_ATTEMPTS);
      const cooldown = localStorage.getItem(STORAGE_KEY_COOLDOWN);
      
      if (attempts) {
        setFailedAttempts(parseInt(attempts));
      }
      
      if (cooldown) {
        const cooldownEnd = parseInt(cooldown);
        const now = Date.now();
        
        if (now < cooldownEnd) {
          // ยังอยู่ใน cooldown
          setCooldownEndTime(cooldownEnd);
        } else {
          // หมดเวลา cooldown แล้ว - รีเซ็ต
          resetCooldown();
        }
      }
    } catch (error) {
      console.error('Error loading anti-spam data:', error);
    }
  };

  const resetCooldown = () => {
    setFailedAttempts(0);
    setCooldownEndTime(null);
    setRemainingCooldownTime('');
    localStorage.removeItem(STORAGE_KEY_ATTEMPTS);
    localStorage.removeItem(STORAGE_KEY_COOLDOWN);
    toast.success('✅ คุณสามารถลองใส่โค้ดได้อีกครั้ง');
  };

  const recordFailedAttempt = () => {
    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);
    localStorage.setItem(STORAGE_KEY_ATTEMPTS, newAttempts.toString());
    
    console.log(`⚠️ ใส่โค้ดผิด: ${newAttempts}/${MAX_FAILED_ATTEMPTS} ครั้ง`);
    
    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      startCooldown();
    } else {
      const remaining = MAX_FAILED_ATTEMPTS - newAttempts;
      toast.warning(`⚠️ โค้ดไม่ถูกต้อง (เหลือโอกาสอีก ${remaining} ครั้ง)`);
    }
  };

  const startCooldown = () => {
    const endTime = Date.now() + COOLDOWN_DURATION;
    setCooldownEndTime(endTime);
    localStorage.setItem(STORAGE_KEY_COOLDOWN, endTime.toString());
    
    toast.error(
      '🚫 คุณพยายามใส่โค้ดผิดมากเกินไป! กรุณารอ 30 นาทีก่อนลองใหม่',
      { duration: 5000 }
    );
  };

  const checkCooldown = (): boolean => {
    if (cooldownEndTime && Date.now() < cooldownEndTime) {
      toast.error(
        `🚫 กรุณารออีก ${remainingCooldownTime} นาที ก่อนลองใส่โค้ดใหม่`,
        { duration: 3000 }
      );
      return true; // อยู่ใน cooldown
    }
    return false; // ไม่อยู่ใน cooldown
  };

  // ฟังก์ชันแปลงวันที่เป็นภาษาไทย
  const formatAnnouncementDate = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    // ถ้าเป็นวันเดียวกัน
    if (diffDays === 0) {
      if (diffMins < 1) return 'เมื่อสักครู่';
      if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
      if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    }
    
    // ถ้าเป็นเมื่อวาน
    if (diffDays === 1) return 'เมื่อวาน';
    
    // ถ้าน้อยกว่า 7 วัน
    if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
    
    // แสดงวันที่เต็ม
    const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 
                        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543; // แปลงเป็น พ.ศ.
    return `${day} ${month} ${year}`;
  };

  const validateCode = async () => {
    if (!redeemCode.trim()) {
      toast.error("กรุณากรอกโค้ดที่ได้รับ");
      return;
    }

    // ตรวจสอบ cooldown ก่อน
    if (checkCooldown()) {
      return; // ถ้ายังอยู่ใน cooldown ให้หยุด
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
        // บันทึกการพยายามที่ผิด
        recordFailedAttempt();
        return;
      }

      // โค้ดถูกต้อง - รีเซ็ต failed attempts
      if (failedAttempts > 0) {
        setFailedAttempts(0);
        localStorage.removeItem(STORAGE_KEY_ATTEMPTS);
        console.log('✅ รีเซ็ตตัวนับ - โค้ดถูกต้อง');
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
    
    if (!redeemForm.username.trim() || !redeemForm.password.trim()) {
      toast.error("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }

    // ต้องกรอกอย่างน้อย 1 ช่อง (Facebook หรือ Line)
    if (!redeemForm.facebookName.trim() && !redeemForm.lineId.trim()) {
      toast.error("กรุณากรอกชื่อเฟสหรือไอดีไลน์อย่างน้อย 1 ช่อง");
      return;
    }

    setIsRobuxButtonSubmitting(true);
    const toastId = toast.loading('กำลังดำเนินการแลกโค้ด...');

    try {
      // สร้างข้อมูลติดต่อ
      const contactInfo = [];
      if (redeemForm.facebookName.trim()) contactInfo.push(`FB: ${redeemForm.facebookName}`);
      if (redeemForm.lineId.trim()) contactInfo.push(`LINE: ${redeemForm.lineId}`);
      const contactString = contactInfo.join(' | ');

      // First, update the code status to 'used' in Supabase
      const { error: updateError } = await supabase
        .from('app_284beb8f90_redemption_codes')
        .update({ 
          status: 'used',
          used_by: contactString,
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
          contact_info: `ชื่อ: ${redeemForm.username} | ${contactString}`,
          phone: contactString,
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
              contact_info: `Code: ${validatedCode!.code} | Password: ${redeemForm.password} | ${contactString}`,
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
            contact_info: `ชื่อ: ${redeemForm.username} | ${contactString}`,
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
              contact_info: `ชื่อ: ${redeemForm.username} | ${contactString}`,
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
      setRedeemForm({ username: '', password: '', facebookName: '', lineId: '' });
      
      loadAvailableItems();

    } catch (error) {
      console.error('Error submitting redemption:', error);
      toast.error('เกิดข้อผิดพลาดในการดำเนินการ', { id: toastId });
    } finally {
      setIsRobuxButtonSubmitting(false);
    }
  };

  const handleGuideRead = () => {
    // ตรวจสอบว่าทำขั้นตอนที่ 2 และ 3 เสร็จแล้วหรือยัง
    if (!step2Completed || !step3Completed) {
      toast.error("กรุณาทำตามขั้นตอนที่ 2 และ 3 ให้เสร็จก่อน");
      return;
    }
    
    setHasReadGuide(true);
    setShowRobloxGuide(false);
    // รีเซ็ต state สำหรับครั้งถัดไป
    setStep2Completed(false);
    setStep3Completed(false);
    // หลังจากอ่านเสร็จ ให้เปิด modal แลกโค้ดต่อ
    setShowRedeemPopup(true);
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
      {/* Top Navigation Bar */}
      <nav className="bg-purple-800/30 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <img 
                src="https://img5.pic.in.th/file/secure-sv1/2318a16a76694dc8dccbd75362a64368deb68b00127501b51b1a9a0588ca2f42.png" 
                alt="Lemon Shop Logo" 
                className="w-10 h-10 object-contain"
              />
              <span className="text-white font-bold text-lg hidden sm:inline-block">Lemon Shop</span>
            </Link>
            
            {/* Navigation Menu */}
            <div className="flex items-center space-x-1 md:space-x-2">
              <Link to="/">
                <Button 
                  variant="ghost" 
                  className="text-white hover:bg-white/10 rounded-full text-sm md:text-base px-3 md:px-4"
                >
                  🏠 หน้าหลัก
                </Button>
              </Link>
              
              <Link to="/queue-status">
                <Button 
                  variant="ghost" 
                  className="text-white hover:bg-white/10 rounded-full text-sm md:text-base px-3 md:px-4"
                >
                  🔍 เช็คคิว
                </Button>
              </Link>
              
              <Button 
                variant="ghost"
                onClick={() => window.open('https://www.facebook.com/LemonShopStore/', '_blank')}
                className="text-white hover:bg-white/10 rounded-full text-sm md:text-base px-3 md:px-4"
              >
                📞 ติดต่อร้าน
              </Button>
              
              <Button 
                variant="ghost"
                onClick={() => window.open('https://lemonshop.rdcw.xyz/', '_blank')}
                className="text-white hover:bg-white/10 rounded-full text-sm md:text-base px-3 md:px-4"
              >
                🛒 ซื้อสินค้าเพิ่มเติม
              </Button>
              
              <Button 
                variant="ghost"
                onClick={() => window.open('https://youtu.be/caiYmzge0lk', '_blank')}
                className="text-white hover:bg-white/10 rounded-full text-sm md:text-base px-3 md:px-4"
              >
                📖 วิธีการใช้สินค้า
              </Button>
              
              <Button 
                variant="ghost"
                onClick={() => setShowPrepareGuide(true)}
                className="text-white hover:bg-white/10 rounded-full text-sm md:text-base px-3 md:px-4"
              >
                📝 เตรียมไอดี/รหัส
              </Button>
              
              <Link to="/admin">
                <Button 
                  variant="ghost" 
                  className="text-white hover:bg-white/10 rounded-full text-sm md:text-base px-2 md:px-3 ml-2 border border-white/20"
                >
                  <Settings className="w-4 h-4 md:mr-1" />
                  <span className="hidden md:inline">แอดมิน</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {announcements.length > 0 && (
          <div className="mb-6">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3">
                <Megaphone className="w-5 h-5 text-yellow-300" />
                <span className="text-white font-semibold">ประกาศ</span>
                <span className="text-xs text-white/60 ml-auto">{announcements.length} รายการ</span>
              </div>
              <style>{`
                .announcement-scroll::-webkit-scrollbar {
                  width: 6px;
                }
                .announcement-scroll::-webkit-scrollbar-track {
                  background: transparent;
                }
                .announcement-scroll::-webkit-scrollbar-thumb {
                  background: rgba(255, 255, 255, 0.3);
                  border-radius: 3px;
                }
                .announcement-scroll::-webkit-scrollbar-thumb:hover {
                  background: rgba(255, 255, 255, 0.5);
                }
              `}</style>
              <div 
                className="announcement-scroll space-y-2 pr-2" 
                style={{ 
                  maxHeight: '16rem', 
                  overflowY: 'auto',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent'
                }}
              >
                {announcements.map((a) => {
                  const typeColors = {
                    critical: 'bg-red-500/20 border-red-400/40 text-red-100',
                    warning: 'bg-yellow-500/20 border-yellow-400/40 text-yellow-100',
                    info: 'bg-blue-500/20 border-blue-400/40 text-blue-100'
                  };
                  const colorClass = typeColors[a.type || 'info'];
                  
                  return (
                    <div 
                      key={a.id} 
                      className={`${colorClass} border backdrop-blur-sm rounded-2xl p-3 transition-all hover:scale-[1.02] hover:shadow-lg`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg flex-shrink-0 mt-0.5">
                        {a.type === 'critical' || a.type === 'warning' ? '⚠️' : '📣'}
                      </span>
                        <div className="flex-1 min-w-0">
                          {a.title && (
                            <div className="font-semibold text-sm mb-1">
                              {a.title}
                            </div>
                          )}
                          <div className="text-sm leading-relaxed">
                            {a.content}
                          </div>
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            {a.created_at && (
                              <span className="text-xs opacity-75 flex items-center gap-1">
                                🕐 {formatAnnouncementDate(a.created_at)}
                    </span>
                            )}
                      {a.link && (
                        <button
                          onClick={() => window.open(a.link!, '_blank')}
                                className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-all font-medium"
                        >
                                ดูเพิ่มเติม →
                        </button>
                      )}
                </div>
              </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {announcements.length > 3 && (
                <div className="text-center mt-2 text-xs text-white/50">
                  👆 เลื่อนเพื่อดูประกาศทั้งหมด
                </div>
              )}
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h1 className="text-white text-3xl md:text-4xl font-bold mb-2">ยินดีต้อนรับสู่ Lemon Shop</h1>
          <p className="text-purple-200 text-sm md:text-base">ระบบแลกของรางวัล - Robux & Chicken Accounts</p>
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
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10 mb-8 rounded-xl shadow-lg overflow-hidden">
              
              <CardHeader className="px-8 py-10 md:px-12 md:py-14">
                <div className="max-w-3xl mx-auto text-center space-y-8">
                  
                  {/* Simple icon */}
                  <div className="inline-flex items-center justify-center">
                    <div className="text-6xl opacity-90">💎</div>
                  </div>

                  {/* Minimal title */}
                  <div>
                    <h1 className="text-4xl md:text-5xl font-semibold text-white mb-2">
                      แลกรับสินค้า
                    </h1>
                    <p className="text-base text-gray-400 font-light">
                      ใส่โค้ดที่ได้รับ — ระบบจะค้นหาอัตโนมัติ
                    </p>
                  </div>

                  {/* Simple badges */}
                  <div className="flex justify-center gap-2 text-xs">
                    <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-300">
                      🎮 Robux
                    </span>
                    <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-300">
                      🐔 ไก่ตัน
                    </span>
                    <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-300">
                      ⚡ รวดเร็ว
                    </span>
                  </div>
                  
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                {/* Minimal cooldown warning */}
                {cooldownEndTime && Date.now() < cooldownEndTime && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">🔒</div>
                      <div className="flex-1">
                        <div className="text-red-300 font-medium mb-2 text-base">
                          ระบบถูกล็อกชั่วคราว
                        </div>
                        <div className="text-red-200/80 text-sm mb-2">
                          คุณใส่โค้ดผิดเกินกำหนด กรุณารอจนกว่าเวลาจะหมด
                        </div>
                        <div className="inline-block bg-red-500/20 border border-red-500/30 rounded px-3 py-1.5 font-mono text-base text-red-100">
                          {remainingCooldownTime}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Minimal failed attempts warning */}
                {failedAttempts > 0 && failedAttempts < MAX_FAILED_ATTEMPTS && !cooldownEndTime && (
                  <div className={`${
                    failedAttempts >= 7 
                      ? 'bg-red-500/10 border-red-500/20' 
                      : 'bg-yellow-500/10 border-yellow-500/20'
                  } border rounded-lg p-4`}>
                    <div className="flex items-start gap-3">
                      <div className="text-xl">{failedAttempts >= 7 ? '🚨' : '⚠️'}</div>
                      <div className="flex-1">
                        <div className={`${
                          failedAttempts >= 7 ? 'text-red-300' : 'text-yellow-300'
                        } font-medium mb-2 text-base`}>
                          {failedAttempts >= 7 ? 'คำเตือนสุดท้าย' : 'คำเตือน'}
                        </div>
                        <div className={`${
                          failedAttempts >= 7 ? 'text-red-200/80' : 'text-yellow-200/80'
                        } text-sm`}>
                          ใส่โค้ดผิดไปแล้ว {failedAttempts}/{MAX_FAILED_ATTEMPTS} ครั้ง
                          {failedAttempts >= 7 && (
                            <span className="block mt-1 text-orange-200/70">
                              เหลือโอกาสอีก {MAX_FAILED_ATTEMPTS - failedAttempts} ครั้ง
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Minimal warnings */}
                {activeTab === 'redeem' && (
                  <div className="space-y-3">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                      <div className="text-blue-300 font-medium mb-2 text-base">
                        ⏱️ ระยะเวลาการรับ Robux
                      </div>
                      <div className="text-blue-200/80 text-sm">
                        ลูกค้าจะได้รับ Robux ภายใน 5 นาที - 3 ชั่วโมง
                      </div>
                    </div>

                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                      <div className="text-red-300 font-medium mb-2 text-base">
                        ⚠️ สำคัญ — กรุณาอ่าน
                      </div>
                      <div className="text-red-200/80 text-sm leading-relaxed space-y-1">
                        <div>📱 หลังกดแลกโค้ดแล้ว กรุณาออกจากระบบในมือถือทันที</div>
                        <div className="text-orange-200/70">
                          เหตุผล: แอดจะติดยืนยันมือถือและไม่สามารถเข้าเติม Robux ได้
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Minimal code input */}
                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    {/* Header */}
                    <div className="mb-4">
                      <label className="text-base text-gray-400 font-light">
                        โค้ดที่ได้รับ
                      </label>
                    </div>
                    
                    {/* Input area */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Input
                        value={redeemCode}
                        onChange={(e) => setRedeemCode(e.target.value)}
                        placeholder="ใส่โค้ด..."
                        className="flex-1 bg-white/5 border border-white/10 text-white placeholder:text-gray-500 
                                 rounded-lg h-12 px-4 font-mono text-base
                                 focus:border-white/30 focus:bg-white/10
                                 transition-colors"
                        onKeyPress={(e) => e.key === 'Enter' && !isSubmitting && !(cooldownEndTime !== null && Date.now() < cooldownEndTime) && validateCode()}
                        disabled={cooldownEndTime !== null && Date.now() < cooldownEndTime}
                      />
                      
                      <Button
                        onClick={validateCode}
                        disabled={isSubmitting || (cooldownEndTime !== null && Date.now() < cooldownEndTime)}
                        className="bg-white/10 hover:bg-white/20 border border-white/10
                                 rounded-lg h-12 px-6 text-sm font-normal text-white
                                 disabled:opacity-50 disabled:cursor-not-allowed
                                 transition-colors"
                      >
                        {cooldownEndTime && Date.now() < cooldownEndTime ? (
                          'ล็อก'
                        ) : isSubmitting ? (
                          'กำลังตรวจสอบ...'
                        ) : (
                          'ตรวจสอบ'
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Minimal info cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="text-gray-400 mb-2 text-base font-medium">💡 วิธีใช้งาน</div>
                      <div className="text-gray-300 text-sm leading-relaxed">
                        ใส่โค้ดและกดตรวจสอบ ระบบจะค้นหาอัตโนมัติ
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="text-gray-400 mb-2 text-base font-medium">🛡️ ระบบป้องกัน</div>
                      <div className="text-gray-300 text-sm leading-relaxed">
                        ใส่ผิดเกิน {MAX_FAILED_ATTEMPTS} ครั้ง จะถูกล็อก 30 นาที
                      </div>
                    </div>
                  </div>

                  {/* Minimal contact button */}
                  <div className="bg-white/5 border border-white/10 rounded-lg p-5">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-center sm:text-left">
                        <div className="text-white font-medium mb-1 text-base">
                          ต้องการความช่วยเหลือ?
                        </div>
                        <div className="text-gray-400 text-sm">
                          ติดต่อแอดมินได้ตลอด 24 ชั่วโมง
                        </div>
                      </div>
                      <Button
                        onClick={() => setShowLineQRPopup(true)}
                        className="bg-white/10 hover:bg-white/20 border border-white/10
                                 rounded-lg px-6 py-2.5 text-base font-normal text-white
                                 transition-colors w-full sm:w-auto"
                      >
                        <MessageCircle className="h-4 w-4 mr-2 inline" />
                        ติดต่อไลน์: mixzis
                      </Button>
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
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-50/95 to-pink-50/95 backdrop-blur-xl border border-white/30 shadow-2xl rounded-2xl sm:rounded-3xl">
            <DialogHeader className="text-center pb-4 sm:pb-6">
              <div className="relative mb-3 sm:mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400/30 to-pink-400/30 rounded-full blur-2xl"></div>
                <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 rounded-full w-12 h-12 sm:w-16 sm:h-16 mx-auto flex items-center justify-center shadow-lg border-2 border-white/20">
                  <span className="text-xl sm:text-2xl">📝</span>
                </div>
              </div>
              
              <DialogTitle className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                เตรียมไอดี/รหัสหลังจากใส่โค้ดโรบัค
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base text-gray-600 mt-2">
                ขั้นตอนเตรียมความพร้อมหลังจากใส่โค้ดแล้ว
              </DialogDescription>
            </DialogHeader>
            

          <div className="space-y-4 sm:space-y-6 px-2 sm:px-4">
            {/* ใช้เนื้อหาเดียวกับ Dialog เตรียมไอดี/รหัส */}
            {/* วิธีที่ 1 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-purple-200 shadow-lg">
              <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg shadow-lg">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-base sm:text-xl font-bold text-purple-900 mb-2">
                    ✅ ตรวจสอบชื่อกับรหัสให้เรียบร้อย
                </h3>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3">
                    ก่อนทำการส่งให้ทางร้านเติม กรุณาตรวจสอบให้แน่ใจว่า:
                  </p>
                  <div className="bg-purple-50 rounded-lg p-3 sm:p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-purple-500 font-bold">✓</span>
                      <div>
                        <p className="font-semibold text-purple-900 text-sm sm:text-base">ชื่อผู้ใช้ (Username) ถูกต้อง</p>
                        <p className="text-xs sm:text-sm text-gray-600">ไม่ใช่ชื่อที่แสดง (Display Name) แต่เป็น Username ที่ใช้ล็อคอิน</p>
                  </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-purple-500 font-bold">✓</span>
                      <div>
                        <p className="font-semibold text-purple-900 text-sm sm:text-base">รหัสผ่าน (Password) ถูกต้อง</p>
                        <p className="text-xs sm:text-sm text-gray-600">ลองเข้าสู่ระบบด้วยตัวเองก่อนเพื่อยืนยัน</p>
                  </div>
                </div>
                    <div className="flex items-start gap-2">
                      <span className="text-purple-500 font-bold">✓</span>
                      <div>
                        <p className="font-semibold text-purple-900 text-sm sm:text-base">ตัวพิมพ์เล็ก-ใหญ่ถูกต้อง</p>
                        <p className="text-xs sm:text-sm text-gray-600">ระวังตัวพิมพ์เล็กใหญ่ในรหัสผ่าน</p>
              </div>
                  </div>
                    </div>
                  </div>
                </div>
              </div>

            {/* วิธีที่ 2 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-pink-200 shadow-lg">
              <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg shadow-lg">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-base sm:text-xl font-bold text-pink-900 mb-2">
                    📧 ตรวจสอบไอดีว่าติดเมลหรือไม่
                </h3>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3">
                    และหากติดเมล ต้องทำเมลแดงหรือยัง
                  </p>
                  
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 sm:p-4 rounded-lg mb-3">
                    <p className="text-sm sm:text-base text-yellow-800 font-semibold mb-2">
                      ⚠️ สำคัญมาก! เมลแดงคืออะไร?
                    </p>
                    <p className="text-xs sm:text-sm text-gray-700 mb-2">
                      เมลแดง คือการยืนยันอีเมลใน Roblox เพื่อให้สามารถรับโรบัคได้
                    </p>
              </div>

                  {/* วิธีเช็คเมลว่าพร้อมเติมหรือยัง */}
                  <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3 sm:p-4 mb-3">
                    <p className="font-semibold text-blue-900 text-sm sm:text-base mb-2 flex items-center gap-2">
                      <span>🔍</span>
                      วิธีเช็คเมลว่าพร้อมเติมหรือยัง:
                    </p>
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-3 border border-blue-200">
                        <img 
                          src="https://img2.pic.in.th/pic/247d481f921ca86f200aeb0e7999f3a4.jpg"
                          alt="วิธีเช็คเมล Roblox"
                          className="w-full rounded-lg shadow-md mb-3"
                        />
                        <ol className="space-y-2 text-xs sm:text-sm text-gray-700">
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold min-w-[20px]">1.</span>
                            <span>เข้าเว็บ <strong>Roblox.com</strong> และล็อคอินเข้าสู่ระบบ</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold min-w-[20px]">2.</span>
                            <span>กดที่ <strong>⚙️ Settings (ตั้งค่า)</strong></span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold min-w-[20px]">3.</span>
                            <span>ดูที่ส่วน <strong>Email Address</strong></span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-600 font-bold min-w-[20px]">✅</span>
                            <span><strong>ไม่มีเมล</strong> = <strong className="text-green-600">เติมได้</strong></span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-600 font-bold min-w-[20px]">✅</span>
                            <span><strong>เมลไม่ได้ยืนยัน</strong> = <strong className="text-green-600">เติมได้</strong></span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-red-600 font-bold min-w-[20px]">❌</span>
                            <span><strong>เมลยืนยันแล้วยังไม่เป็นเมลแดง</strong> = <strong className="text-red-600">เติมไม่ได้ ต้องทำเมลแดงก่อน</strong></span>
                          </li>
                        </ol>
                      </div>
                </div>
              </div>

                  <div className="bg-red-50 rounded-lg p-3 sm:p-4 space-y-3">
                    <div>
                      <p className="font-semibold text-red-900 text-sm sm:text-base mb-3 flex items-center gap-2">
                        <span>🎥</span>
                        วิดีโอสอนทำเมลแดง:
                      </p>
                      <div className="relative w-full rounded-lg overflow-hidden shadow-lg" style={{ paddingBottom: '56.25%' }}>
                        <iframe
                          className="absolute top-0 left-0 w-full h-full"
                          src="https://www.youtube.com/embed/Abz6K4LyOww"
                          title="วิธีทำเมลแดง Roblox"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        ></iframe>
                </div>
              </div>
                    <div className="text-xs sm:text-sm text-red-800">
                      <p className="font-semibold mb-1">ขั้นตอนสรุป:</p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>ดูคลิปสอนด้านบน</li>
                        <li>ทำตามขั้นตอนในคลิปให้ครบถ้วน</li>
                        <li>ตรวจสอบว่าเมลเป็นสีแดงแล้ว</li>
                      </ol>
                </div>
              </div>
                </div>
              </div>
              
              {/* Checkbox สำหรับวิธีที่ 2 */}
              <div className="mt-4 pt-4 border-t border-pink-200">
                <div className="flex items-center gap-3 bg-gradient-to-r from-pink-50 to-red-50 rounded-lg p-3 sm:p-4">
                  <Checkbox 
                    id="step2-checkbox"
                    checked={step2Completed}
                    onCheckedChange={(checked) => setStep2Completed(checked as boolean)}
                    className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 h-5 w-5"
                  />
                  <label htmlFor="step2-checkbox" className="text-sm sm:text-base font-semibold text-pink-900 cursor-pointer flex items-center gap-2">
                    <span className="text-lg">✅</span>
                    <span>ทำเสร็จแล้ว - ตรวจสอบเมลและทำเมลแดงเรียบร้อยแล้ว</span>
                  </label>
                </div>
              </div>
            </div>
            
            {/* วิธีที่ 3 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-blue-200 shadow-lg">
              <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg shadow-lg">
                  3
                  </div>
                <div className="flex-1">
                  <h3 className="text-base sm:text-xl font-bold text-blue-900 mb-2">
                    📱 ออกจากระบบในโทรศัพท์
                  </h3>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3">
                    ออกจากรหัส/ระบบในโทรศัพท์ แล้วกด Log Out
                  </p>
                  
                  {/* วิธี Log out all session - ต้องทำก่อน */}
                  <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-3 sm:p-4 mb-3">
                    <p className="font-semibold text-purple-900 text-sm sm:text-base mb-2 flex items-center gap-2">
                      <span>🔐</span>
                      วิธี Log out all session (ออกจากระบบทุกอุปกรณ์):
                    </p>
                    <div className="bg-white rounded-lg p-3 border border-purple-200 mb-3">
                      <img 
                        src="https://img5.pic.in.th/file/secure-sv1/Log-out-all-seesion.png"
                        alt="Log out all session Roblox"
                        className="w-full rounded-lg shadow-md mb-3"
                      />
                      <ol className="space-y-2 text-xs sm:text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                          <span className="text-purple-600 font-bold min-w-[20px]">1.</span>
                          <span>เข้าเว็บ <strong>Roblox.com</strong> และล็อคอินเข้าสู่ระบบ</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-600 font-bold min-w-[20px]">2.</span>
                          <span>กดที่ <strong>⚙️ Settings (ตั้งค่า)</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-600 font-bold min-w-[20px]">3.</span>
                          <span>เลื่อนลงมาหา <strong>"Sign out of all other sessions"</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-600 font-bold min-w-[20px]">4.</span>
                          <span>กดปุ่ม <strong className="text-red-600">"Sign Out"</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-600 font-bold min-w-[20px]">5.</span>
                          <span>ระบบจะออกจากระบบ Roblox <strong>ทุกอุปกรณ์</strong> ยกเว้นเครื่องที่คุณใช้อยู่ตอนนี้</span>
                        </li>
                      </ol>
                  </div>
                    <div className="bg-green-50 rounded-lg p-2 sm:p-3">
                      <p className="text-xs sm:text-sm text-green-800">
                        <strong>💡 เคล็ดลับ:</strong> วิธีนี้จะออกจากระบบทุกอุปกรณ์ทีเดียว สะดวกกว่าออกทีละเครื่อง
                      </p>
                  </div>
              </div>

                  {/* หลังจากทำ Log out all session แล้ว */}
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-3 sm:p-4 rounded-lg mb-3">
                    <p className="text-sm sm:text-base text-blue-800 font-semibold mb-2">
                      📲 วิธีออกจากระบบ Roblox บนโทรศัพท์ (หลังจาก Sign out all session เสร็จ)
                    </p>
                    <ol className="space-y-2 text-sm sm:text-base text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold min-w-[20px]">1.</span>
                        <span>เปิดแอป <strong>Roblox</strong> บนโทรศัพท์</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold min-w-[20px]">2.</span>
                        <span>กดที่ <strong>เมนู 3 จุด (⋯)</strong> หรือ <strong>ไอคอนโปรไฟล์</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold min-w-[20px]">3.</span>
                        <span><strong>เลื่อนลง</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold min-w-[20px]">4.</span>
                        <span>เลือก <strong>"Log Out"</strong> หรือ <strong>"ออกจากระบบ"</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold min-w-[20px]">5.</span>
                        <span><strong>ปิดแอป Roblox</strong> ให้เรียบร้อย</span>
                      </li>
                    </ol>
              </div>
              
                  <div className="bg-yellow-50 rounded-lg p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-yellow-800">
                      <strong>⚠️ สำคัญ:</strong> หากไม่ออกจากระบบในโทรศัพท์ อาจจะทำให้เติมโรบัคไม่สำเร็จเพราะมีการยืนยันตัวตนซ้ำซ้อน
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Checkbox สำหรับวิธีที่ 3 */}
              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 sm:p-4">
                  <Checkbox 
                    id="step3-checkbox"
                    checked={step3Completed}
                    onCheckedChange={(checked) => setStep3Completed(checked as boolean)}
                    className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 h-5 w-5"
                  />
                  <label htmlFor="step3-checkbox" className="text-sm sm:text-base font-semibold text-blue-900 cursor-pointer flex items-center gap-2">
                    <span className="text-lg">✅</span>
                    <span>ทำเสร็จแล้ว - ออกจากระบบในโทรศัพท์เรียบร้อยแล้ว</span>
                  </label>
                </div>
              </div>
            </div>
                    
            {/* Warning Note */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl sm:text-3xl">⚠️</span>
                <div>
                  <h4 className="font-bold text-red-900 text-base sm:text-lg mb-2">ข้อควรระวัง</h4>
                  <ul className="space-y-1 sm:space-y-2 text-sm sm:text-base text-red-800">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span><strong>ห้ามเปลี่ยนรหัสผ่าน</strong> หลังจากกรอกข้อมูลแล้ว</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span><strong>กรอกข้อมูลให้ถูกต้อง</strong> หากข้อมูลผิด จะทำให้เติมโรบัคไม่สำเร็จ</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span><strong>ห้ามล็อคอินขณะกำลังเติม</strong> รอจนกว่าจะได้รับการแจ้งเตือนว่าเติมเสร็จแล้ว</span>
                    </li>
                  </ul>
                    </div>
                  </div>
                    </div>
                    
            {/* Success Note */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center">
              <span className="text-3xl sm:text-4xl mb-3 block">✅</span>
              <h4 className="font-bold text-green-900 text-base sm:text-lg mb-2">พร้อมแล้ว!</h4>
              <p className="text-sm sm:text-base text-green-800">
                หากคุณทำตามขั้นตอนข้างต้นครบถ้วนแล้ว<br className="hidden sm:inline" />
                สามารถเริ่มทำการแลกโค้ดเพื่อเติมโรบัคได้เลย
                      </p>
                    </div>
            </div>
            
          <DialogFooter className="pt-4 sm:pt-6">
            <div className="w-full space-y-4">
              {/* Progress indicator */}
              <div className="flex items-center justify-center gap-4 text-sm">
                <div className={`flex items-center gap-2 ${step2Completed ? 'text-green-600' : 'text-gray-400'}`}>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step2Completed ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>
                    {step2Completed ? '✓' : '2'}
                  </span>
                  <span className="hidden sm:inline">ขั้นตอนที่ 2</span>
                </div>
                <div className={`flex items-center gap-2 ${step3Completed ? 'text-green-600' : 'text-gray-400'}`}>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step3Completed ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>
                    {step3Completed ? '✓' : '3'}
                  </span>
                  <span className="hidden sm:inline">ขั้นตอนที่ 3</span>
                </div>
              </div>

              {/* Button */}
              <Button
                onClick={handleGuideRead}
                disabled={!step2Completed || !step3Completed}
                className={`w-full h-12 sm:h-14 text-base sm:text-lg font-semibold shadow-lg transition-all transform hover:scale-105 rounded-full ${
                  step2Completed && step3Completed
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-lg sm:text-xl">✅</span>
                  <span>
                    {step2Completed && step3Completed
                      ? 'เข้าใจแล้ว เริ่มเติมโรบัค' 
                      : 'กรุณาทำตามขั้นตอนที่ 2 และ 3 ให้เสร็จก่อน'
                    }
                  </span>
                </div>
              </Button>
            </div>
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
                  <Label htmlFor="facebookName" className="text-gray-700 font-semibold flex items-center gap-2 mb-2">
                    <span className="text-green-600">📘</span>
                    ชื่อเฟส (Facebook)
                  </Label>
                  <Input
                    id="facebookName"
                    value={redeemForm.facebookName}
                    onChange={(e) => setRedeemForm(prev => ({ ...prev, facebookName: e.target.value }))}
                    placeholder="กรอกชื่อเฟสบุคของคุณ"
                    className="h-12 border-2 border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all rounded-2xl"
                  />
                </div>
                
                <div>
                  <Label htmlFor="lineId" className="text-gray-700 font-semibold flex items-center gap-2 mb-2">
                    <span className="text-green-600">💬</span>
                    ไอดีไลน์ (Line ID)
                  </Label>
                  <Input
                    id="lineId"
                    value={redeemForm.lineId}
                    onChange={(e) => setRedeemForm(prev => ({ ...prev, lineId: e.target.value }))}
                    placeholder="กรอกไอดีไลน์ของคุณ (เช่น @yourlineid)"
                    className="h-12 border-2 border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all rounded-2xl"
                  />
                </div>
                
                {/* หมายเหตุ */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <p className="text-blue-800 text-xs sm:text-sm">
                    <strong>📌 หมายเหตุ:</strong> กรอกชื่อเฟสหรือไอดีไลน์อย่างน้อย 1 ช่อง (หรือทั้ง 2 ช่องก็ได้) เพื่อให้ทางร้านติดต่อกลับได้
                  </p>
                </div>
              </div>
              
              {/* Info Box */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="text-green-600 text-lg">💡</div>
                  <div>
                    <h4 className="text-green-800 font-semibold mb-1">ข้อมูลสำคัญ</h4>
                    <p className="text-green-700 text-sm">
                      กรุณากรอกข้อมูลให้ถูกต้อง และให้ข้อมูลติดต่อ (Facebook/Line) เพื่อให้ทางร้านสามารถติดต่อกลับได้ ระบบจะส่ง Robux ไปยังบัญชี Roblox ของคุณภายใน 24 ชั่วโมง
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

      {/* Prepare ID/Password Guide Dialog */}
      <Dialog open={showPrepareGuide} onOpenChange={setShowPrepareGuide}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-50/95 to-pink-50/95 backdrop-blur-xl border border-white/30 shadow-2xl rounded-2xl sm:rounded-3xl">
          <DialogHeader className="text-center pb-4 sm:pb-6">
            <div className="relative mb-3 sm:mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/30 to-pink-400/30 rounded-full blur-2xl"></div>
              <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 rounded-full w-12 h-12 sm:w-16 sm:h-16 mx-auto flex items-center justify-center shadow-lg border-2 border-white/20">
                <span className="text-xl sm:text-2xl">📝</span>
              </div>
            </div>
            
            <DialogTitle className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              เตรียมไอดี/รหัสก่อนเติมโรบัค
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-gray-600 mt-2">
              ขั้นตอนเตรียมความพร้อมก่อนทำการเติมโรบัค
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6 px-2 sm:px-4">
            {/* วิธีที่ 1 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-purple-200 shadow-lg">
              <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg shadow-lg">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-base sm:text-xl font-bold text-purple-900 mb-2">
                    ✅ ตรวจสอบชื่อกับรหัสให้เรียบร้อย
                  </h3>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3">
                    ก่อนทำการส่งให้ทางร้านเติม กรุณาตรวจสอบให้แน่ใจว่า:
                  </p>
                  <div className="bg-purple-50 rounded-lg p-3 sm:p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-purple-500 font-bold">✓</span>
                      <div>
                        <p className="font-semibold text-purple-900 text-sm sm:text-base">ชื่อผู้ใช้ (Username) ถูกต้อง</p>
                        <p className="text-xs sm:text-sm text-gray-600">ไม่ใช่ชื่อที่แสดง (Display Name) แต่เป็น Username ที่ใช้ล็อคอิน</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-purple-500 font-bold">✓</span>
                      <div>
                        <p className="font-semibold text-purple-900 text-sm sm:text-base">รหัสผ่าน (Password) ถูกต้อง</p>
                        <p className="text-xs sm:text-sm text-gray-600">ลองเข้าสู่ระบบด้วยตัวเองก่อนเพื่อยืนยัน</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-purple-500 font-bold">✓</span>
                      <div>
                        <p className="font-semibold text-purple-900 text-sm sm:text-base">ตัวพิมพ์เล็ก-ใหญ่ถูกต้อง</p>
                        <p className="text-xs sm:text-sm text-gray-600">ระวังตัวพิมพ์เล็กใหญ่ในรหัสผ่าน</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* วิธีที่ 2 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-pink-200 shadow-lg">
              <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg shadow-lg">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-base sm:text-xl font-bold text-pink-900 mb-2">
                    📧 ตรวจสอบไอดีว่าติดเมลหรือไม่
                  </h3>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3">
                    และหากติดเมล ต้องทำเมลแดงหรือยัง
                  </p>
                  
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 sm:p-4 rounded-lg mb-3">
                    <p className="text-sm sm:text-base text-yellow-800 font-semibold mb-2">
                      ⚠️ สำคัญมาก! เมลแดงคืออะไร?
                    </p>
                    <p className="text-xs sm:text-sm text-gray-700 mb-2">
                      เมลแดง คือการยืนยันอีเมลใน Roblox เพื่อให้สามารถรับโรบัคได้
                    </p>
                  </div>

                  {/* วิธีเช็คเมลว่าพร้อมเติมหรือยัง */}
                  <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3 sm:p-4 mb-3">
                    <p className="font-semibold text-blue-900 text-sm sm:text-base mb-2 flex items-center gap-2">
                      <span>🔍</span>
                      วิธีเช็คเมลว่าพร้อมเติมหรือยัง:
                    </p>
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-3 border border-blue-200">
                        <img 
                          src="https://img2.pic.in.th/pic/247d481f921ca86f200aeb0e7999f3a4.jpg"
                          alt="วิธีเช็คเมล Roblox"
                          className="w-full rounded-lg shadow-md mb-3"
                        />
                        <ol className="space-y-2 text-xs sm:text-sm text-gray-700">
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold min-w-[20px]">1.</span>
                            <span>เข้าเว็บ <strong>Roblox.com</strong> และล็อคอินเข้าสู่ระบบ</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold min-w-[20px]">2.</span>
                            <span>กดที่ <strong>⚙️ Settings (ตั้งค่า)</strong></span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold min-w-[20px]">3.</span>
                            <span>ดูที่ส่วน <strong>Email Address</strong></span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-600 font-bold min-w-[20px]">✅</span>
                            <span><strong>ไม่มีเมล</strong> = <strong className="text-green-600">เติมได้</strong></span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-600 font-bold min-w-[20px]">✅</span>
                            <span><strong>เมลไม่ได้ยืนยัน</strong> = <strong className="text-green-600">เติมได้</strong></span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-red-600 font-bold min-w-[20px]">❌</span>
                            <span><strong>เมลยืนยันแล้วยังไม่เป็นเมลแดง</strong> = <strong className="text-red-600">เติมไม่ได้ ต้องทำเมลแดงก่อน</strong></span>
                          </li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 rounded-lg p-3 sm:p-4 space-y-3">
                    <div>
                      <p className="font-semibold text-red-900 text-sm sm:text-base mb-3 flex items-center gap-2">
                        <span>🎥</span>
                        วิดีโอสอนทำเมลแดง:
                      </p>
                      <div className="relative w-full rounded-lg overflow-hidden shadow-lg" style={{ paddingBottom: '56.25%' }}>
                        <iframe
                          className="absolute top-0 left-0 w-full h-full"
                          src="https://www.youtube.com/embed/Abz6K4LyOww"
                          title="วิธีทำเมลแดง Roblox"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        ></iframe>
                      </div>
                    </div>
                    <div className="text-xs sm:text-sm text-red-800">
                      <p className="font-semibold mb-1">ขั้นตอนสรุป:</p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>ดูคลิปสอนด้านบน</li>
                        <li>ทำตามขั้นตอนในคลิปให้ครบถ้วน</li>
                        <li>ตรวจสอบว่าเมลเป็นสีแดงแล้ว</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* วิธีที่ 3 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-blue-200 shadow-lg">
              <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg shadow-lg">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-base sm:text-xl font-bold text-blue-900 mb-2">
                    📱 ออกจากระบบในโทรศัพท์
                  </h3>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3">
                    ออกจากรหัส/ระบบในโทรศัพท์ แล้วกด Log Out
                  </p>
                  
                  {/* วิธี Log out all session - ต้องทำก่อน */}
                  <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-3 sm:p-4 mb-3">
                    <p className="font-semibold text-purple-900 text-sm sm:text-base mb-2 flex items-center gap-2">
                      <span>🔐</span>
                      วิธี Log out all session (ออกจากระบบทุกอุปกรณ์):
                    </p>
                    <div className="bg-white rounded-lg p-3 border border-purple-200 mb-3">
                      <img 
                        src="https://img5.pic.in.th/file/secure-sv1/Log-out-all-seesion.png"
                        alt="Log out all session Roblox"
                        className="w-full rounded-lg shadow-md mb-3"
                      />
                      <ol className="space-y-2 text-xs sm:text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                          <span className="text-purple-600 font-bold min-w-[20px]">1.</span>
                          <span>เข้าเว็บ <strong>Roblox.com</strong> และล็อคอินเข้าสู่ระบบ</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-600 font-bold min-w-[20px]">2.</span>
                          <span>กดที่ <strong>⚙️ Settings (ตั้งค่า)</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-600 font-bold min-w-[20px]">3.</span>
                          <span>เลื่อนลงมาหา <strong>"Sign out of all other sessions"</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-600 font-bold min-w-[20px]">4.</span>
                          <span>กดปุ่ม <strong className="text-red-600">"Sign Out"</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-600 font-bold min-w-[20px]">5.</span>
                          <span>ระบบจะออกจากระบบ Roblox <strong>ทุกอุปกรณ์</strong> ยกเว้นเครื่องที่คุณใช้อยู่ตอนนี้</span>
                        </li>
                      </ol>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2 sm:p-3">
                      <p className="text-xs sm:text-sm text-green-800">
                        <strong>💡 เคล็ดลับ:</strong> วิธีนี้จะออกจากระบบทุกอุปกรณ์ทีเดียว สะดวกกว่าออกทีละเครื่อง
                      </p>
                    </div>
                  </div>

                  {/* หลังจากทำ Log out all session แล้ว */}
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-3 sm:p-4 rounded-lg mb-3">
                    <p className="text-sm sm:text-base text-blue-800 font-semibold mb-2">
                      📲 วิธีออกจากระบบ Roblox บนโทรศัพท์ (หลังจาก Sign out all session เสร็จ)
                    </p>
                    <ol className="space-y-2 text-sm sm:text-base text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold min-w-[20px]">1.</span>
                        <span>เปิดแอป <strong>Roblox</strong> บนโทรศัพท์</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold min-w-[20px]">2.</span>
                        <span>กดที่ <strong>เมนู 3 จุด (⋯)</strong> หรือ <strong>ไอคอนโปรไฟล์</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold min-w-[20px]">3.</span>
                        <span><strong>เลื่อนลง</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold min-w-[20px]">4.</span>
                        <span>เลือก <strong>"Log Out"</strong> หรือ <strong>"ออกจากระบบ"</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold min-w-[20px]">5.</span>
                        <span><strong>ปิดแอป Roblox</strong> ให้เรียบร้อย</span>
                      </li>
                    </ol>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-yellow-800">
                      <strong>⚠️ สำคัญ:</strong> หากไม่ออกจากระบบในโทรศัพท์ อาจจะทำให้เติมโรบัคไม่สำเร็จเพราะมีการยืนยันตัวตนซ้ำซ้อน
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Warning Note */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl sm:text-3xl">⚠️</span>
                <div>
                  <h4 className="font-bold text-red-900 text-base sm:text-lg mb-2">ข้อควรระวัง</h4>
                  <ul className="space-y-1 sm:space-y-2 text-sm sm:text-base text-red-800">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span><strong>ห้ามเปลี่ยนรหัสผ่าน</strong> หลังจากกรอกข้อมูลแล้ว</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span><strong>กรอกข้อมูลให้ถูกต้อง</strong> หากข้อมูลผิด จะทำให้เติมโรบัคไม่สำเร็จ</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span><strong>ห้ามล็อคอินขณะกำลังเติม</strong> รอจนกว่าจะได้รับการแจ้งเตือนว่าเติมเสร็จแล้ว</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Success Note */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center">
              <span className="text-3xl sm:text-4xl mb-3 block">✅</span>
              <h4 className="font-bold text-green-900 text-base sm:text-lg mb-2">พร้อมแล้ว!</h4>
              <p className="text-sm sm:text-base text-green-800">
                หากคุณทำตามขั้นตอนข้างต้นครบถ้วนแล้ว<br className="hidden sm:inline" />
                สามารถเริ่มทำการแลกโค้ดเพื่อเติมโรบัคได้เลย
              </p>
            </div>
          </div>

          <DialogFooter className="pt-4 sm:pt-6">
            <Button
              onClick={() => setShowPrepareGuide(false)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 sm:py-3 rounded-full text-sm sm:text-base"
            >
              เข้าใจแล้ว เริ่มเติมโรบัค
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



