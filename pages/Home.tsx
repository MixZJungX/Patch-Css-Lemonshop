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
import { RedemptionRequest, RedemptionCode, ChickenAccount } from '@/types';
import { GamepadIcon, Settings, Megaphone } from 'lucide-react';
import '@/styles/notifications.css';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'redeem' | 'chicken' | 'rainbow'>('redeem');
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
  const [availableRainbowCodes, setAvailableRainbowCodes] = useState<RainbowCode[]>([]);
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

  useEffect(() => {
    loadAvailableItems();
    loadAnnouncements();
  }, []);

  // Calculate statistics when data changes
  useEffect(() => {
    if (availableCodes.length > 0) {
      const totalValue = availableCodes.reduce((sum, code) => sum + (code.robux_value || code.robux_amount || 0), 0);
      setTotalRobuxValue(totalValue);
    }
  }, [availableCodes]);

  useEffect(() => {
    if (availableAccounts.length > 0) {
      const activeAccounts = availableAccounts.filter(account => !account.is_redeemed).length;
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

  const getAlertVariant = (type?: string) => (type === 'critical' ? 'destructive' : 'default');

  const validateCode = async () => {
    if (!redeemCode.trim()) {
      toast.error("กรุณากรอกโค้ดที่ได้รับ");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Check in Supabase directly for accurate status
      const { data: codeData, error: codeError } = await supabase
        .from('app_284beb8f90_redemption_codes')
        .select('*')
        .ilike('code', redeemCode.trim())
        .eq('status', 'available')
        .single();

      if (codeError || !codeData) {
        toast.error("โค้ดไม่ถูกต้องหรือถูกใช้แล้ว");
        return;
      }

      setValidatedCode(codeData);
      setShowRedeemPopup(true);
      toast.success("โค้ดถูกต้อง! กรุณากรอกข้อมูลเพื่อรับ Robux");

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

      const requestData = {
        id: crypto.randomUUID(),
        code_id: validatedCode!.id,
        roblox_username: redeemForm.username,
        roblox_password: redeemForm.password,
        contact_info: `Code: ${validatedCode!.code} | Password: ${redeemForm.password} | Phone: ${redeemForm.contact}`,
        robux_amount: validatedCode!.robux_value || validatedCode!.robux_amount || 0,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      // Save the redemption request
      const { error: saveError } = await supabase
        .from('app_284beb8f90_redemption_requests')
        .insert([requestData]);

      if (saveError) {
        console.error('❌ ไม่สามารถบันทึกคำขอใน Supabase ได้:', saveError);
        toast.error('เกิดข้อผิดพลาดในการบันทึกคำขอ กรุณาลองใหม่อีกครั้ง', { id: toastId });
        return;
      }

      console.log('✅ บันทึกคำขอใน Supabase สำเร็จ:', requestData);
      
      setShowRedeemPopup(false);
      setValidatedCode(null);
      setRedeemCode('');
      setRedeemForm({ username: '', password: '', contact: '' });
      toast.success('✅ แลกโค้ดสำเร็จ! ทางร้านจะดำเนินการให้ภายใน 24 ชั่วโมง', { id: toastId });
      
      loadAvailableItems();

    } catch (error) {
      console.error('Error submitting redemption:', error);
      toast.error('เกิดข้อผิดพลาดในการดำเนินการ', { id: toastId });
    } finally {
      setIsRobuxButtonSubmitting(false);
    }
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
      const foundAccount = availableAccounts.find(account => 
        (account.code || account.redeem_code).toLowerCase() === chickenRedeemCode.toLowerCase()
      ) || 
      // Also check used accounts to allow re-entry
      await supabase
        .from('app_284beb8f90_chicken_accounts')
        .select('*')
        .ilike('code', chickenRedeemCode)
        .single()
        .then(result => result.data)
        .catch(() => null);

      if (!foundAccount) {
        toast.error("โค้ดไม่ถูกต้องหรือไม่พบ", { id: toastId });
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
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-3xl flex items-center justify-center">
              <span className="text-white text-2xl">💎</span>
            </div>
            <div>
              <h1 className="text-white text-xl font-bold">ระบบแลกของรางวัล</h1>
              <p className="text-purple-200 text-sm">Robux & Chicken Accounts Exchange</p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Link to="/status">
              <Button className="bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20 transition-all rounded-full">
                🔍 เช็คสถานะ
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



        <div className="flex justify-center mb-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-2 border border-white/20">
            <Button
              onClick={() => setActiveTab('redeem')}
              className={`px-6 py-3 rounded-full transition-all ${
                activeTab === 'redeem'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                  : 'bg-transparent text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              🎫 แลกโค้ด
            </Button>
            <Button
              onClick={() => setActiveTab('chicken')}
              className={`px-6 py-3 rounded-full transition-all ${
                activeTab === 'chicken'
                  ? 'bg-gradient-to-r from-orange-600 to-yellow-600 text-white shadow-lg'
                  : 'bg-transparent text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              🐔 แลกไก่ตัน
            </Button>
            
            <Button
              onClick={() => setActiveTab('rainbow')}
              className={`px-6 py-3 rounded-full transition-all ${
                activeTab === 'rainbow'
                  ? 'bg-gradient-to-r from-blue-600 to-orange-600 text-white shadow-lg'
                  : 'bg-transparent text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              🎮 Rainbow Six
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-4xl mx-auto">
          {(activeTab === 'redeem' || activeTab === 'chicken') && (
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 mb-8 rounded-3xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-white flex items-center justify-center space-x-2">
                  <span className="text-3xl">{activeTab === 'redeem' ? '💳' : '🐔'}</span>
                  <span>{activeTab === 'redeem' ? 'แลกโค้ดรับ Robux' : 'แลกโค้ดรับบัญชีไก่ตัน'}</span>
                </CardTitle>
                <p className="text-blue-200">
                  {activeTab === 'redeem' ? 'ใส่โค้ดที่ได้รับเพื่อแลกเป็น Robux' : 'ใส่โค้ดที่ได้รับเพื่อแลกบัญชีเกมไก่ตัน'}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      {activeTab === 'redeem' ? 'โค้ดที่ได้รับ' : 'โค้ดที่ได้รับ'}
                    </label>
                    <div className="flex space-x-3">
                      <Input
                        value={activeTab === 'redeem' ? redeemCode : chickenRedeemCode}
                        onChange={(e) => activeTab === 'redeem' ? setRedeemCode(e.target.value) : setChickenRedeemCode(e.target.value)}
                        placeholder="ใส่โค้ดที่ได้รับ"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 flex-1 rounded-2xl"
                        onKeyPress={(e) => e.key === 'Enter' && (activeTab === 'redeem' ? validateCode() : handleChickenRedeemCode())}
                      />
                      <Button
                        onClick={activeTab === 'redeem' ? validateCode : handleChickenRedeemCode}
                        disabled={activeTab === 'redeem' ? isSubmitting : isChickenButtonSubmitting}
                        className={`bg-gradient-to-r rounded-full ${activeTab === 'redeem' ? 'from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' : 'from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700'}`}
                      >
                        {(activeTab === 'redeem' ? isSubmitting : isChickenButtonSubmitting) ? 'ตรวจสอบ...' : 'ตรวจสอบ'}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-blue-900/30 border border-blue-500/30 rounded-2xl p-4">
                    <p className="text-blue-100 text-sm">
                      <strong>💡 วิธีใช้:</strong> {activeTab === 'redeem' ? 'ใส่โค้ดที่ได้รับและกดตรวจสอบ หากโค้ดถูกต้อง จะมีหน้าต่างขึ้นมาให้ใส่ชื่อผู้ใช้และรหัสผ่าน Roblox เพื่อรับ Robux' : 'โค้ดที่ได้รับจะถูกตรวจสอบและแสดงข้อมูลบัญชีที่สามารถใช้งานได้ กรุณาเก็บข้อมูลบัญชีอย่างปลอดภัยหลังจากได้รับ'}
                    </p>
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
                        {validatedChickenAccount.username || validatedChickenAccount.account_username || 'ไม่มีข้อมูล'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">รหัสผ่าน:</Label>
                      <div className="bg-white p-2 rounded-2xl border font-mono text-sm mt-1">
                        {validatedChickenAccount.password || validatedChickenAccount.account_password || 'ไม่มีข้อมูล'}
                      </div>
                    </div>
                    {(validatedChickenAccount.email || validatedChickenAccount.account_email) && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">อีเมล:</Label>
                        <div className="bg-white p-2 rounded-2xl border font-mono text-sm mt-1">
                          {validatedChickenAccount.email || validatedChickenAccount.account_email}
                        </div>
                      </div>
                    )}
                    {(validatedChickenAccount.level || validatedChickenAccount.account_level) && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">เลเวล:</Label>
                        <div className="bg-white p-2 rounded-2xl border font-mono text-sm mt-1">
                          {validatedChickenAccount.level || validatedChickenAccount.account_level}
                        </div>
                      </div>
                    )}
                    {(validatedChickenAccount.description || validatedChickenAccount.notes) && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">รายละเอียด:</Label>
                        <div className="bg-white p-2 rounded-2xl border text-sm mt-1">
                          {validatedChickenAccount.description || validatedChickenAccount.notes}
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
                className="w-full bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700"
              >
                🐔 เสร็จสิ้น
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Robux Redemption Dialog */}
        <Dialog open={showRedeemPopup} onOpenChange={setShowRedeemPopup}>
          <DialogContent className="sm:max-w-lg bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl border border-white/30 shadow-2xl">
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
                กรอกข้อมูล Roblox ของคุณเพื่อรับ <span className="font-bold text-green-600">{validatedCode?.robux_value || validatedCode?.robux_amount} Robux</span>
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
                    className="h-12 border-2 border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all"
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
                    className="h-12 border-2 border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all"
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
                    className="h-12 border-2 border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all"
                  />
                </div>
              </div>
              
              {/* Info Box */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
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
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg transition-all transform hover:scale-105"
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

        {/* Additional Products Section */}
        <div className="mt-16 text-center">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
            <h3 className="text-2xl font-bold text-white mb-4">🛒 สินค้าเพิ่มเติม</h3>
            <p className="text-purple-200 mb-6">เยี่ยมชมร้านค้าออนไลน์ของเราเพื่อดูสินค้าอื่นๆ เพิ่มเติม ไก่ตัน Robux โค้ด Rainbow Six</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="text-3xl mb-2">🐔</div>
                <h4 className="text-white font-semibold mb-2">ไก่ตัน</h4>
                <p className="text-purple-200 text-sm">บัญชีเกมไก่ตัน</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="text-3xl mb-2">💎</div>
                <h4 className="text-white font-semibold mb-2">Robux</h4>
                <p className="text-purple-200 text-sm">โค้ดแลก Robux</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="text-3xl mb-2">🌈</div>
                <h4 className="text-white font-semibold mb-2">Rainbow Six</h4>
                <p className="text-purple-200 text-sm">โค้ดเกม Rainbow Six</p>
              </div>
            </div>
            
            <Button 
              onClick={() => window.open('https://lemonshop.rdcw.xyz/', '_blank')}
              className="bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 text-white px-8 py-3 rounded-xl shadow-lg transition-all transform hover:scale-105 mb-8"
            >
              🛒 ไปยังร้านค้าออนไลน์
            </Button>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-8 text-center">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
            <h3 className="text-2xl font-bold text-white mb-4">📞 ต้องการความช่วยเหลือ?</h3>
            <p className="text-purple-200 mb-6">ติดต่อเราได้ผ่าน Facebook เพื่อรับบริการและคำแนะนำ</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={() => window.open('https://www.facebook.com/LemonShopStore/', '_blank')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-xl shadow-lg transition-all transform hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                📱 ติดต่อ Lemon Shop
              </Button>
              
              <div className="text-purple-200 text-sm">
                <p>⏰ เปิดบริการ: 24 ชั่วโมง</p>
                <p>💬 ตอบกลับภายใน 5-10 นาที</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


