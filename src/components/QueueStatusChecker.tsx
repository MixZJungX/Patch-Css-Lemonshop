import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { QueueItem, QueueDisplay } from '@/types';
import { getQueuePosition, getQueueDisplay, searchQueueByGameInfo } from '@/lib/queueApi';
import { testSimpleSearch } from '@/lib/testSearch';
import { Search, Clock, CheckCircle, XCircle, AlertCircle, Users, Play, MessageSquare, X, MessageCircle, Home, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export default function QueueStatusChecker() {
  const [queueNumber, setQueueNumber] = useState('');
  const [queueItem, setQueueItem] = useState<QueueItem | null>(null);
  const [queuePosition, setQueuePosition] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [queueDisplay, setQueueDisplay] = useState<QueueDisplay | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLineQRPopup, setShowLineQRPopup] = useState(false);
  const [searchResults, setSearchResults] = useState<QueueItem[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  // State สำหรับฟอร์มแก้ไขชื่อและรหัสผ่าน
  const [showUpdateCredentialsForm, setShowUpdateCredentialsForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // State สำหรับอัพโหลดรูปภาพ
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // โหลดข้อมูลจอแสดงคิว
  const loadQueueDisplay = async () => {
    try {
      const data = await getQueueDisplay();
      setQueueDisplay(data);
    } catch (error) {
      console.error('Error loading queue display:', error);
    }
  };

  useEffect(() => {
    loadQueueDisplay();
    const interval = setInterval(loadQueueDisplay, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCheckStatus = async () => {
    if (!queueNumber.trim()) {
      setError('กรุณากรอกข้อมูลสำหรับค้นหา');
      return;
    }

    setLoading(true);
    setError('');
    setQueueItem(null);
    setSearchResults([]);

    try {
      // ค้นหาจากคิวอย่างเดียว - เรียบง่าย
      const results = await searchQueueByGameInfo(queueNumber);
      
      if (results.length > 0) {
        setSearchResults(results);
        // ถ้าพบผลลัพธ์เดียว ให้แสดงทันที
        if (results.length === 1) {
          setQueueItem(results[0]);
          if (results[0].status === 'waiting') {
            const position = await getQueuePosition(results[0].queue_number);
            setQueuePosition(position);
          } else {
            setQueuePosition(0);
          }
        }
      } else {
        setError(`ไม่พบคิวที่ตรงกับ "${queueNumber}" กรุณาตรวจสอบหมายเลขคิว ชื่อในเกม หรือเบอร์โทรอีกครั้ง`);
      }
    } catch (err) {
      console.error('Error checking queue status:', err);
      setError('เกิดข้อผิดพลาดในการตรวจสอบ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'waiting': return { icon: <Clock className="w-5 h-5" />, color: 'bg-yellow-500', text: 'รอการดำเนินการ', description: 'คิวของคุณอยู่ในรายการรอ กรุณารอการเรียก' };
      case 'processing': return { icon: <AlertCircle className="w-5 h-5" />, color: 'bg-blue-500', text: 'กำลังดำเนินการ', description: 'คิวของคุณกำลังถูกดำเนินการ กรุณารอสักครู่' };
      case 'completed': return { icon: <CheckCircle className="w-5 h-5" />, color: 'bg-green-500', text: 'เสร็จสิ้น', description: 'การดำเนินการเสร็จสิ้นแล้ว' };
      case 'cancelled': return { icon: <XCircle className="w-5 h-5" />, color: 'bg-red-500', text: 'ยกเลิก', description: 'คิวนี้ถูกยกเลิกแล้ว' };
      case 'problem': return { icon: <AlertCircle className="w-5 h-5" />, color: 'bg-orange-500', text: 'มีปัญหา', description: 'คิวของคุณมีปัญหา กรุณาติดต่อแอดมิน' };
      case 'customer_fixed': return { icon: <CheckCircle className="w-5 h-5" />, color: 'bg-emerald-500', text: 'ลูกค้าแก้ไขแล้ว', description: 'คุณได้แก้ไขปัญหาเรียบร้อยแล้ว กำลังดำเนินการต่อ' };
      case 'pending': return { icon: <Clock className="w-5 h-5" />, color: 'bg-yellow-500', text: 'รอการดำเนินการ', description: 'คิวของคุณอยู่ในรายการรอ กรุณารอการเรียก' };
      default: return { icon: <Clock className="w-5 h-5" />, color: 'bg-yellow-500', text: 'รอการดำเนินการ', description: 'คิวของคุณอยู่ในรายการรอ กรุณารอการเรียก' };
    }
  };

  const getProductTypeInfo = (type: string) => {
    switch (type) {
      case 'robux': return { icon: '🎮', name: 'Robux' };
      case 'chicken': return { icon: '🐔', name: 'Chicken Account' };
      case 'rainbow': return { icon: '🌈', name: 'Rainbow Six' };
      default: return { icon: '📦', name: 'สินค้า' };
    }
  };

  const handleCustomerFixedProblem = async () => {
    if (!queueItem) return;

    setUpdatingStatus(true);
    try {
      // Import supabase
      const { supabase } = await import('@/lib/supabase');
      
      // อัปเดตสถานะเป็น customer_fixed และเพิ่มหมายเหตุ
      const updatedNotes = queueItem.admin_notes ? 
        `${queueItem.admin_notes} | ✅ ลูกค้าแก้ไขปัญหาเบื้องต้นด้วยตัวเองแล้ว` :
        '✅ ลูกค้าแก้ไขปัญหาเบื้องต้นด้วยตัวเองแล้ว';

      const { error } = await supabase
        .from('queue_items')
        .update({
          status: 'customer_fixed',
          admin_notes: updatedNotes
        })
        .eq('id', queueItem.id);

      if (error) {
        throw new Error('ไม่สามารถอัปเดตสถานะได้');
      }

      // อัปเดตสถานะใน state
      setQueueItem(prev => prev ? {
        ...prev,
        status: 'customer_fixed',
        admin_notes: updatedNotes
      } : null);

      // แสดงข้อความสำเร็จ
      alert('✅ ขอบคุณครับ! ระบบได้รับข้อมูลแล้วว่าคุณได้แก้ไขปัญหาเรียบร้อย');
      
      // โหลดข้อมูลใหม่
      loadQueueDisplay();
      
    } catch (error) {
      console.error('Error updating queue status:', error);
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleImageUpload = async () => {
    if (!queueItem || !imagePreview) {
      alert('กรุณาเลือกรูปภาพก่อน');
      return;
    }

    setUploading(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      
      console.log('📤 กำลังบันทึกรูปภาพ (Base64):', {
        queueId: queueItem.id,
        imageSize: imagePreview.length
      });

      // บันทึกรูปภาพเป็น Base64 ในฐานข้อมูลโดยตรง
      const customerUpdateData = {
        game_history_image: imagePreview, // บันทึก Base64 string
        uploaded_at: new Date().toISOString(),
        note: 'ลูกค้าอัพโหลดประวัติการเล่น'
      };

      const { error: dbError } = await supabase
        .from('queue_items')
        .update({
          customer_updated_credentials: customerUpdateData,
          status: 'customer_fixed'
        })
        .eq('id', queueItem.id);

      if (dbError) {
        console.error('❌ Database error:', dbError);
        throw new Error('ไม่สามารถบันทึกข้อมูลได้: ' + dbError.message);
      }

      console.log('✅ บันทึกสำเร็จ');

      alert('✅ ส่งรูปภาพสำเร็จ!\n\nคิวของคุณถูกย้ายไปที่ "ลูกค้าแก้ไขแล้ว"\nแอดมินจะตรวจสอบและดำเนินการให้ครับ');
      setShowUploadForm(false);
      setUploadedImage(null);
      setImagePreview(null);
      
      await loadQueueDisplay();
      
    } catch (error: any) {
      console.error('❌ Error uploading image:', error);
      alert('เกิดข้อผิดพลาด: ' + (error.message || 'กรุณาลองใหม่อีกครั้ง'));
    } finally {
      setUploading(false);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // ตรวจสอบขนาดไฟล์ (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('ไฟล์มีขนาดใหญ่เกิน 5MB กรุณาเลือกไฟล์ใหม่');
        return;
      }

      // ตรวจสอบประเภทไฟล์
      if (!file.type.startsWith('image/')) {
        alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
        return;
      }

      setUploadedImage(file);
      
      // สร้าง preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateCredentials = async () => {
    if (!queueItem || !newUsername.trim() || !newPassword.trim()) {
      alert('กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบถ้วน');
      return;
    }

    setUpdatingStatus(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      
      // สร้าง contact_info ใหม่ทั้งหมด โดยแทนที่ส่วนที่เกี่ยวข้อง
      let updatedContactInfo = queueItem.contact_info;
      
      // แทนที่ Username ทุกรูปแบบ
      if (updatedContactInfo.includes('Username:')) {
        updatedContactInfo = updatedContactInfo.replace(/Username:\s*[^|]+/gi, `Username: ${newUsername}`);
      } else if (updatedContactInfo.includes('ชื่อ:')) {
        updatedContactInfo = updatedContactInfo.replace(/ชื่อ:\s*[^|]+/gi, `ชื่อ: ${newUsername}`);
      } else {
        // ถ้าไม่มี ให้เพิ่มเข้าไปด้านหน้า
        updatedContactInfo = `Username: ${newUsername} | ${updatedContactInfo}`;
      }
      
      // แทนที่ Password ทุกรูปแบบ
      if (updatedContactInfo.includes('Password:')) {
        updatedContactInfo = updatedContactInfo.replace(/Password:\s*[^|]+/gi, `Password: ${newPassword}`);
      } else if (updatedContactInfo.includes('รหัสผ่าน:')) {
        updatedContactInfo = updatedContactInfo.replace(/รหัสผ่าน:\s*[^|]+/gi, `รหัสผ่าน: ${newPassword}`);
      } else {
        // ถ้าไม่มี ให้เพิ่มเข้าไป
        updatedContactInfo = `${updatedContactInfo} | Password: ${newPassword}`;
      }
      
      // สร้าง JSON object สำหรับเก็บข้อมูลที่ลูกค้าอัปเดต
      const customerUpdateData = {
        username: newUsername,
        password: newPassword,
        old_username: queueItem.roblox_username || queueItem.customer_name,
        updated_at: new Date().toISOString(),
        note: 'ลูกค้าส่งข้อมูลใหม่มาเอง'
      };

      console.log('🔄 กำลังอัปเดตข้อมูล:', {
        oldUsername: queueItem.roblox_username,
        newUsername,
        queueId: queueItem.id,
        customerUpdateData,
        note: 'บันทึกในคอลัมน์แยก customer_updated_credentials'
      });

      const { error } = await supabase
        .from('queue_items')
        .update({
          customer_updated_credentials: customerUpdateData,
          status: 'customer_fixed' // เปลี่ยนสถานะเป็น "ลูกค้าแก้ไขแล้ว"
          // เก็บข้อมูลใหม่ไว้ในคอลัมน์แยก
          // ไม่แตะต้องข้อมูลเดิม (contact_info, roblox_username, etc.)
        })
        .eq('id', queueItem.id);

      if (error) {
        console.error('❌ Supabase error:', error);
        throw new Error('ไม่สามารถอัปเดตข้อมูลได้: ' + error.message);
      }

      console.log('✅ อัปเดตสำเร็จ');

      // อัปเดต state (ไม่ต้องเปลี่ยนอะไร เพราะข้อมูลเก็บแยก)
      // ไม่ต้อง setState เพราะไม่ได้แสดงผลข้อมูลนี้ในหน้าลูกค้า

      alert(`✅ ส่งข้อมูลสำเร็จ!\n\nชื่อผู้ใช้ใหม่: ${newUsername}\nรหัสผ่านใหม่: ${newPassword}\n\nคิวของคุณถูกย้ายไปที่ "ลูกค้าแก้ไขแล้ว"\nแอดมินจะดำเนินการให้ครับ`);
      setShowUpdateCredentialsForm(false);
      setNewUsername('');
      setNewPassword('');
      
      // โหลดข้อมูลใหม่
      await loadQueueDisplay();
      
    } catch (error: any) {
      console.error('❌ Error updating credentials:', error);
      alert('เกิดข้อผิดพลาดในการอัปเดตข้อมูล: ' + (error.message || 'กรุณาลองใหม่อีกครั้ง'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ฟังก์ชันซ่อนรหัสผ่านใน contact_info
  const hidePasswordInContactInfo = (contactInfo: string) => {
    return contactInfo
      .replace(/Password:\s*[^|]+/g, 'Password: ••••••••••')
      .replace(/password:\s*[^|]+/gi, 'Password: ••••••••••')
      .replace(/Password:\s*\.+/g, 'Password: ••••••••••')
      .replace(/password:\s*\.+/gi, 'Password: ••••••••••');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatWaitTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} นาที`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} ชั่วโมง ${remainingMinutes} นาที`;
  };

  const handleSelectQueue = async (selectedQueue: QueueItem) => {
    setQueueItem(selectedQueue);
    setSearchResults([]);
    
    if (selectedQueue.status === 'waiting') {
      const position = await getQueuePosition(selectedQueue.queue_number);
      setQueuePosition(position);
    } else {
      setQueuePosition(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="w-full max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-8">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Link 
            to="/" 
            className="group flex items-center space-x-2 sm:space-x-3 bg-white/10 backdrop-blur-xl hover:bg-white/20 border border-white/20 hover:border-white/30 rounded-xl sm:rounded-2xl px-3 py-2 sm:px-6 sm:py-3 transition-all duration-300 hover:scale-105 shadow-lg"
          >
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-1.5 sm:p-2 group-hover:scale-110 transition-transform duration-300">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-semibold text-sm sm:text-lg">กลับหน้าแรก</div>
              <div className="text-purple-200 text-xs sm:text-sm">Thai Robux Redemption</div>
            </div>
          </Link>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link 
              to="/admin" 
              className="group bg-white/10 backdrop-blur-xl hover:bg-white/20 border border-white/20 hover:border-white/30 rounded-xl sm:rounded-2xl px-3 py-1.5 sm:px-4 sm:py-2 transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-full p-1 sm:p-1.5 group-hover:scale-110 transition-transform duration-300">
                  <Home className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <span className="text-white text-xs sm:text-sm font-medium">แอดมิน</span>
              </div>
            </Link>
          </div>
        </div>

        {/* หัวข้อหลัก */}
        <div className="text-center space-y-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/20 shadow-2xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 sm:mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              🎯 ระบบคิว
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-purple-200 font-medium">Thai Robux Redemption System</p>
            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="bg-green-500/20 rounded-full px-3 py-1 sm:px-4 sm:py-2 border border-green-400/30">
                <span className="text-green-300 text-xs sm:text-sm">🟢 ระบบพร้อมใช้งาน</span>
              </div>
              <div className="bg-blue-500/20 rounded-full px-3 py-1 sm:px-4 sm:py-2 border border-blue-400/30">
                <span className="text-blue-300 text-xs sm:text-sm">⚡ Real-time Updates</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          {/* ด้านซ้าย: เช็คสถานะคิว */}
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/20 shadow-2xl">
              <div className="text-center mb-4 sm:mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">🔍 เช็คสถานะคิว</h2>
                <p className="text-purple-200 text-sm sm:text-base">ค้นหาด้วยหมายเลขคิว หรือชื่อในเกม</p>
              </div>
              
              <div className="space-y-4 sm:space-y-6">
                {/* Search Bar for Queue Display */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="ค้นหาคิว... (ชื่อในเกมเท่านั้น)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl sm:rounded-2xl text-white placeholder:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 text-sm sm:text-base"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      <X className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  )}
                </div>
                
                <div className="flex gap-2 sm:gap-3">
                  <Input
                    type="text"
                    placeholder="กรอกชื่อในเกมเท่านั้น (เช่น: PlayerName)"
                    value={queueNumber}
                    onChange={(e) => setQueueNumber(e.target.value)}
                    className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-purple-300 rounded-xl sm:rounded-2xl text-sm sm:text-base"
                  />
                  <Button 
                    onClick={handleCheckStatus} 
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl sm:rounded-2xl px-3 sm:px-6 text-sm sm:text-base"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-1 sm:mr-2"></div>
                        <span className="hidden sm:inline">กำลังตรวจสอบ...</span>
                        <span className="sm:hidden">กำลัง...</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Search className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">ตรวจสอบ</span>
                        <span className="sm:hidden">ค้นหา</span>
                      </div>
                    )}
                  </Button>
                </div>

                {error && (
                  <Alert className="border-red-400/30 bg-red-500/10 backdrop-blur-sm rounded-xl sm:rounded-2xl">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-300">
                      <div className="space-y-2 sm:space-y-3">
                        <div className="text-sm sm:text-base">{error}</div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
                          <span className="text-xs sm:text-sm text-red-200">หากมีปัญหา กรุณาติดต่อแอดมิน</span>
                          <Button
                            onClick={() => setShowLineQRPopup(true)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1 text-xs sm:text-sm"
                          >
                            <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            <span className="hidden sm:inline">ติดต่อแอดมิน</span>
                            <span className="sm:hidden">ติดต่อ</span>
                          </Button>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* แสดงผลการค้นหาเมื่อมีหลายผลลัพธ์ */}
                {searchResults.length > 1 && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/20">
                    <h3 className="text-white font-semibold mb-2 sm:mb-3 text-sm sm:text-base">พบคิวที่ตรงกัน {searchResults.length} รายการ:</h3>
                    <div className="space-y-2">
                      {searchResults.map((result) => (
                        <div
                          key={result.id}
                          onClick={() => handleSelectQueue(result)}
                          className="bg-white/5 hover:bg-white/10 rounded-lg p-2 sm:p-3 cursor-pointer transition-colors border border-white/10"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-white font-medium text-sm sm:text-base">คิว #{result.queue_number}</div>
                              <div className="text-purple-200 text-xs sm:text-sm">
                                {result.roblox_username && `ชื่อ: ${result.roblox_username}`}
                                {result.assigned_code && ` | โค้ด: ${result.assigned_code}`}
                              </div>
                            </div>
                            <Badge className={`${getStatusInfo(result.status).color} text-white rounded-full px-2 py-1 text-xs`}>
                              {getStatusInfo(result.status).text}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {queueItem && (
                  <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20">
                    <div className="text-center mb-4">
                      <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-2 drop-shadow-lg">
                        #{queueItem.queue_number}
                      </div>
                      <div className="flex items-center justify-center mb-2">
                        <span className="text-xl sm:text-2xl mr-2">{getProductTypeInfo(queueItem.product_type).icon}</span>
                        <span className="text-lg sm:text-xl font-semibold text-white">{getProductTypeInfo(queueItem.product_type).name}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-white/10 rounded-xl p-3">
                        <span className="font-medium text-purple-200 text-sm">สถานะ:</span>
                        <Badge className={`${getStatusInfo(queueItem.status).color} text-white rounded-full px-3 py-1 text-xs`}>
                          <div className="flex items-center">
                            {getStatusInfo(queueItem.status).icon}
                            <span className="ml-1">{getStatusInfo(queueItem.status).text}</span>
                          </div>
                        </Badge>
                      </div>

        {(queueItem.roblox_username || queueItem.customer_name) && (
          <div className="flex items-center justify-between bg-white/10 rounded-xl p-3">
            <span className="font-medium text-purple-200 text-sm">👤 ชื่อลูกค้า:</span>
            <span className="text-white text-sm">{queueItem.roblox_username || queueItem.customer_name}</span>
          </div>
        )}

        {queueItem.contact_info && (
          <div className="flex items-center justify-between bg-white/10 rounded-xl p-3">
            <span className="font-medium text-purple-200 text-sm">ข้อมูลติดต่อ:</span>
            <span className="text-white text-xs">
              {hidePasswordInContactInfo(queueItem.contact_info)}
            </span>
          </div>
        )}

        {queueItem.roblox_username && (
          <div className="flex items-center justify-between bg-white/10 rounded-xl p-3">
            <span className="font-medium text-purple-200 text-sm">🎮 Roblox Username:</span>
            <span className="text-white text-sm">{queueItem.roblox_username}</span>
          </div>
        )}

        {queueItem.roblox_password && (
          <div className="flex items-center justify-between bg-white/10 rounded-xl p-3">
            <span className="font-medium text-purple-200 text-sm">🔒 รหัสผ่าน:</span>
            <span className="text-white font-mono text-sm">••••••••••</span>
          </div>
        )}

        {queueItem.robux_amount && (
          <div className="flex items-center justify-between bg-white/10 rounded-xl p-3">
            <span className="font-medium text-purple-200 text-sm">💎 จำนวน Robux:</span>
            <span className="text-white text-sm">{queueItem.robux_amount}</span>
          </div>
        )}

        {queueItem.assigned_code && (
          <div className="flex items-center justify-between bg-white/10 rounded-xl p-3">
            <span className="font-medium text-purple-200 text-sm">🎫 โค้ด:</span>
            <span className="text-white font-mono text-sm">{queueItem.assigned_code}</span>
          </div>
        )}

        {queueItem.assigned_account_code && (
          <div className="flex items-center justify-between bg-white/10 rounded-xl p-3">
            <span className="font-medium text-purple-200 text-sm">🔑 Account Code:</span>
            <span className="text-white font-mono text-sm">{queueItem.assigned_account_code}</span>
          </div>
        )}
                      
                      <div className="flex items-center justify-between bg-white/10 rounded-xl p-3">
                        <span className="font-medium text-purple-200 text-sm">วันที่สร้างคิว:</span>
                        <span className="text-white text-sm">{formatDate(queueItem.created_at)}</span>
                      </div>

                      {queueItem.status === 'waiting' && queuePosition > 0 && (
                        <div className="flex items-center justify-between bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-3 border border-yellow-400/30">
                          <span className="font-medium text-yellow-200 text-sm">ตำแหน่งในคิว:</span>
                          <span className="font-bold text-lg text-yellow-300">ลำดับที่ {queuePosition}</span>
                        </div>
                      )}
                      
                      {queueItem.estimated_wait_time && queueItem.status === 'waiting' && (
                        <div className="flex items-center justify-between bg-white/10 rounded-xl p-3">
                          <span className="font-medium text-purple-200 text-sm">เวลารอโดยประมาณ:</span>
                          <span className="text-white font-semibold text-sm">{queueItem.estimated_wait_time} นาที</span>
                        </div>
                      )}

                      {queueItem.admin_notes && (
                        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-xl p-3 border border-yellow-400/30">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-yellow-300 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-medium text-yellow-200 block mb-1 text-sm">หมายเหตุจากแอดมิน:</span>
                              <span className="text-yellow-100 text-xs">{queueItem.admin_notes}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 bg-blue-500/20 backdrop-blur-sm rounded-xl p-3 border border-blue-400/30">
                      <p className="text-xs text-blue-200 text-center">💡 {getStatusInfo(queueItem.status).description}</p>
                    </div>

                    {/* ปุ่มติดต่อไลน์สำหรับสถานะอื่นๆ */}
                    {(queueItem.status === 'cancelled' || queueItem.status === 'waiting') && (
                      <div className="mt-3 bg-blue-500/20 backdrop-blur-sm rounded-xl p-3 border border-blue-400/30">
                        <div className="text-center space-y-3">
                          <p className="text-xs text-blue-200">📞 ต้องการความช่วยเหลือ? ติดต่อแอดมินได้เลย</p>
                          <div className="flex flex-col sm:flex-row gap-2 justify-center">
                          </div>
                          <Button
                            onClick={() => setShowLineQRPopup(true)}
                            className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm"
                          >
                            <MessageCircle className="h-3 w-3 mr-1" />
                            ติดต่อไลน์ (mixzis)
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* แสดงประเภทปัญหาและวิธีแก้ไข */}
                    {queueItem.status === 'problem' && (
                      <div className="mt-3 bg-orange-500/20 backdrop-blur-sm rounded-xl p-4 border border-orange-400/30">
                        <div className="space-y-4">
                          {/* แสดงประเภทปัญหา */}
                          <div className="text-center">
                            <div className="inline-flex items-center gap-2 bg-orange-600/50 px-3 py-2 rounded-lg mb-3">
                              <span className="text-2xl">
                                {queueItem.admin_notes?.includes('ติดยืนยันแมพ') && '🗺️'}
                                {queueItem.admin_notes?.includes('ติดยืนยันโทรศัพท์') && '📱'}
                                {queueItem.admin_notes?.includes('ติดยืนยันเมล') && '📧'}
                                {queueItem.admin_notes?.includes('ชื่อหรือรหัสผิด') && '🔒'}
                                {!queueItem.admin_notes?.includes('ติดยืนยันแมพ') && 
                                 !queueItem.admin_notes?.includes('ติดยืนยันโทรศัพท์') && 
                                 !queueItem.admin_notes?.includes('ติดยืนยันเมล') && 
                                 !queueItem.admin_notes?.includes('ชื่อหรือรหัสผิด') && '❓'}
                              </span>
                              <span className="text-orange-200 font-semibold">
                                {queueItem.admin_notes?.includes('ติดยืนยันแมพ') && 'ติดยืนยันแมพ'}
                                {queueItem.admin_notes?.includes('ติดยืนยันโทรศัพท์') && 'ติดยืนยันโทรศัพท์'}
                                {queueItem.admin_notes?.includes('ติดยืนยันเมล') && 'ติดยืนยันเมล'}
                                {queueItem.admin_notes?.includes('ชื่อหรือรหัสผิด') && 'ชื่อหรือรหัสผิด'}
                                {!queueItem.admin_notes?.includes('ติดยืนยันแมพ') && 
                                 !queueItem.admin_notes?.includes('ติดยืนยันโทรศัพท์') && 
                                 !queueItem.admin_notes?.includes('ติดยืนยันเมล') && 
                                 !queueItem.admin_notes?.includes('ชื่อหรือรหัสผิด') && 'ปัญหาอื่นๆ'}
                              </span>
                            </div>
                          </div>

                          {/* แสดงวิธีแก้ไขเบื้องต้น */}
                          <div className="bg-white/10 rounded-lg p-3">
                            <h4 className="text-orange-200 font-semibold mb-2 flex items-center gap-2">
                              <span>💡</span>
                              วิธีแก้ไขเบื้องต้น:
                            </h4>
                            <div className="text-orange-100 text-sm space-y-2">
                              {queueItem.admin_notes?.includes('ติดยืนยันแมพ') && (
                                <>
                                  <p className="font-semibold text-orange-100 mb-2">📤 วิธีส่งประวัติการเล่น:</p>
                                  <div className="space-y-1 pl-2 mb-3">
                                    <p>1. เข้าเว็บ Roblox บนคอมพิวเตอร์หรือโทรศัพท์</p>
                                    <p>2. ไปที่หน้าหลัก (Home)</p>
                                    <p>3. กดไปที่ <strong>Continue</strong> (หน้าเกมที่เล่นล่าสุด)</p>
                                    <p>4. แคปหน้าจอส่วนนี้ทั้งหมด</p>
                                  </div>

                                  <Button
                                    onClick={() => setShowUploadForm(!showUploadForm)}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-2"
                                  >
                                    {showUploadForm ? '❌ ปิดฟอร์ม' : '📤 อัพโหลดรูปภาพที่นี่'}
                                  </Button>

                                  {showUploadForm && (
                                    <div className="bg-white/10 rounded-lg p-4 space-y-3">
                                      <div>
                                        <Label className="text-orange-200 text-sm mb-2 block">เลือกรูปภาพประวัติการเล่น:</Label>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={handleImageSelect}
                                          className="w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                                        />
                                        <p className="text-xs text-orange-200/70 mt-1">รองรับไฟล์: JPG, PNG (ขนาดไม่เกิน 5MB)</p>
                                      </div>

                                      {imagePreview && (
                                        <div className="space-y-2">
                                          <Label className="text-orange-200 text-sm">ตัวอย่างรูปภาพ:</Label>
                                          <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full max-h-60 object-contain rounded-lg border-2 border-orange-400/50"
                                          />
                                        </div>
                                      )}

                                      <Button
                                        onClick={handleImageUpload}
                                        disabled={uploading || !uploadedImage}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                                      >
                                        {uploading ? (
                                          <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            กำลังอัพโหลด...
                                          </>
                                        ) : (
                                          '✅ ส่งรูปภาพ'
                                        )}
                                      </Button>
                                    </div>
                                  )}

                                  <p className="text-xs mt-2 bg-orange-600/30 px-2 py-1 rounded text-orange-100">
                                    💡 หมายเหตุ: นี้คือประวัติการเล่นทั้งหมดของคุณ ต้องเห็นเกมที่เล่นชัดเจน
                                  </p>
                                </>
                              )}
                              {queueItem.admin_notes?.includes('ติดยืนยันโทรศัพท์') && (
                                <>
                                  <p className="font-semibold text-orange-100 mb-2">📱 วิธีแก้ไขปัญหาการยืนยันโทรศัพท์:</p>
                                  
                                  <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-4 mb-3">
                                    <p className="text-white font-semibold mb-2 flex items-center gap-2">
                                      <span>🔓</span>
                                      วิธีแก้ไข:
                                    </p>
                                    <div className="space-y-2 text-sm">
                                      <p className="bg-white/10 p-2 rounded">
                                        <span className="font-semibold text-yellow-300">⚠️ สำคัญ:</span> ให้คุณ<span className="font-bold text-yellow-200"> ล็อคเอาท์ (Log Out) ออกจาก Roblox ในโทรศัพท์</span>ของคุณ
                                      </p>
                                      <p className="pl-2">1. เข้าแอป Roblox ในโทรศัพท์</p>
                                      <p className="pl-2">2. กดที่เมนู (3 จุด) หรือไอคอนโปรไฟล์</p>
                                      <p className="pl-2">3. เลือก "Log Out" หรือ "ออกจากระบบ"</p>
                                      <p className="pl-2">4. ยืนยันการออกจากระบบ</p>
                                    </div>
                                  </div>

                                  <div className="space-y-1 pl-2 text-sm">
                                    <p className="font-semibold">ขั้นตอนสรุป:</p>
                                    <p>1. ล็อคเอาท์ออกจาก Roblox ในโทรศัพท์</p>
                                    <p>2. หากมั่นใจว่าล็อคเอาท์แล้ว กดปุ่ม "แก้ไขปัญหาแล้ว" ด้านล่าง</p>
                                    <p>3. หากมีปัญหา สอบถาม/ทักมาทางไลน์</p>
                                  </div>
                                </>
                              )}
                              {queueItem.admin_notes?.includes('ติดยืนยันเมล') && (
                                <>
                                  <p className="font-semibold text-orange-100 mb-2">📧 วิธีทำเมลแดง:</p>
                                  
                                  <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-3 mb-3">
                                    <p className="text-white font-semibold mb-2 flex items-center gap-2">
                                      <span>🎥</span>
                                      ดูคลิปสอนทำเมลแดง:
                                    </p>
                                    <a
                                      href="https://youtu.be/uw2N7kl5ZbU?si=3bCCzPxt0A4ffBlV"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg text-center font-semibold transition-all"
                                    >
                                      ▶️ คลิกดูวิดีโอสอนทำเมลแดง
                                    </a>
                                    <p className="text-xs text-orange-100 mt-2">💡 ดูคลิปแล้วทำตามขั้นตอนให้ครบถ้วน</p>
                                  </div>

                                  <div className="space-y-1 pl-2 text-sm">
                                    <p className="font-semibold">ขั้นตอนสรุป:</p>
                                    <p>1. ดูคลิปสอนด้านบน</p>
                                    <p>2. ทำตามขั้นตอนในคลิปให้ครบถ้วน</p>
                                    <p>3. หากทำเสร็จแล้ว กดปุ่ม "แก้ไขปัญหาแล้ว" ด้านล่าง</p>
                                    <p>4. หากมีปัญหา สอบถาม/ทักมาทางไลน์</p>
                                  </div>
                                </>
                              )}
                              {queueItem.admin_notes?.includes('ชื่อหรือรหัสผิด') && (
                                <>
                                  <p className="text-orange-200 font-semibold mb-2">📝 คุณสามารถแก้ไขข้อมูลได้ที่นี่:</p>
                                  <Button
                                    onClick={() => setShowUpdateCredentialsForm(!showUpdateCredentialsForm)}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-2"
                                  >
                                    {showUpdateCredentialsForm ? '❌ ปิดฟอร์ม' : '✏️ กรอกชื่อและรหัสผ่านใหม่'}
                                  </Button>
                                  
                                  {showUpdateCredentialsForm && (
                                    <div className="bg-white/10 rounded-lg p-3 space-y-3 mt-2">
                                      <div>
                                        <Label className="text-orange-200 text-sm mb-1 block">ชื่อผู้ใช้ (Username):</Label>
                                        <Input
                                          value={newUsername}
                                          onChange={(e) => setNewUsername(e.target.value)}
                                          placeholder="กรอกชื่อผู้ใช้ใหม่"
                                          className="bg-white/20 text-white border-orange-300/50 placeholder:text-gray-400"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-orange-200 text-sm mb-1 block">รหัสผ่าน (Password):</Label>
                                        <Input
                                          value={newPassword}
                                          onChange={(e) => setNewPassword(e.target.value)}
                                          placeholder="กรอกรหัสผ่านใหม่"
                                          type="text"
                                          className="bg-white/20 text-white border-orange-300/50 placeholder:text-gray-400"
                                        />
                                      </div>
                                      <Button
                                        onClick={handleUpdateCredentials}
                                        disabled={updatingStatus || !newUsername.trim() || !newPassword.trim()}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                                      >
                                        {updatingStatus ? (
                                          <>
                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                            กำลังอัปเดต...
                                          </>
                                        ) : (
                                          '✅ ส่งข้อมูลใหม่'
                                        )}
                                      </Button>
                                      <p className="text-xs text-orange-200/70">
                                        หมายเหตุ: ข้อมูลนี้จะถูกส่งให้แอดมินเป็นหมายเหตุ แอดมินจะดำเนินการอัปเดตให้คุณ
                                      </p>
                                    </div>
                                  )}
                                  
                                  <p className="text-xs mt-2 text-orange-100/70">หรือลองวิธีแก้ไขเหล่านี้:</p>
                                  <p>1. ตรวจสอบชื่อผู้ใช้และรหัสผ่านให้ถูกต้อง</p>
                                  <p>2. ดูว่าตัวพิมพ์เล็ก-ใหญ่ถูกต้อง</p>
                                  <p>3. ลองกดแสดงรหัสผ่านเพื่อดู</p>
                                </>
                              )}
                              {!queueItem.admin_notes?.includes('ติดยืนยันแมพ') && 
                               !queueItem.admin_notes?.includes('ติดยืนยันโทรศัพท์') && 
                               !queueItem.admin_notes?.includes('ติดยืนยันเมล') && 
                               !queueItem.admin_notes?.includes('ชื่อหรือรหัสผิด') && (
                                <>
                                  <p>1. ตรวจสอบข้อมูลที่ส่งมาทั้งหมด</p>
                                  <p>2. ลองดำเนินการใหม่อีกครั้ง</p>
                                  <p>3. หากยังไม่ได้ กรุณาติดต่อแอดมิน</p>
                                </>
                              )}
                            </div>
                          </div>

                          {/* ปุ่มติดต่อแอดมินและปุ่มแก้ไขปัญหาแล้ว */}
                        <div className="text-center space-y-3">
                            <p className="text-orange-200 text-xs">
                              หากยังแก้ไขไม่ได้ กรุณาติดต่อแอดมิน
                            </p>
                          <div className="flex flex-col sm:flex-row gap-2 justify-center">
                            <Button
                                onClick={handleCustomerFixedProblem}
                                disabled={updatingStatus}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50"
                              >
                                {updatingStatus ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                    กำลังอัปเดต...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    ✅ แก้ไขปัญหาแล้ว
                                  </>
                                )}
                            </Button>
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
                    )}

                    {/* แสดงเมื่อลูกค้าแก้ไขปัญหาแล้ว */}
                    {queueItem.status === 'customer_fixed' && (
                      <div className="mt-3 bg-emerald-500/20 backdrop-blur-sm rounded-xl p-4 border border-emerald-400/30">
                        <div className="text-center space-y-3">
                          <div className="inline-flex items-center gap-2 bg-emerald-600/50 px-3 py-2 rounded-lg">
                            <span className="text-2xl">✅</span>
                            <span className="text-emerald-200 font-semibold">ลูกค้าแก้ไขปัญหาแล้ว</span>
                          </div>
                          <p className="text-emerald-200 text-sm">
                            ขอบคุณครับ! คุณได้แก้ไขปัญหาเบื้องต้นด้วยตัวเองเรียบร้อยแล้ว<br/>
                            ระบบกำลังดำเนินการต่อ กรุณารอสักครู่
                          </p>
                          <div className="bg-white/10 rounded-lg p-3">
                            <p className="text-emerald-100 text-xs">
                              💡 ระบบจะอัปเดตสถานะเป็น "กำลังดำเนินการ" ในไม่ช้า
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ด้านขวา: จอแสดงคิว */}
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/20 shadow-2xl">
              <div className="text-center mb-4 sm:mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">📺 จอแสดงคิว</h2>
                <p className="text-purple-200 text-sm sm:text-base">ติดตามสถานะคิวแบบ Real-time</p>
              </div>
              
              {!queueDisplay ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                  <p className="text-purple-200">กำลังโหลดข้อมูล...</p>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {/* สถิติรวม */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                    <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-xl p-2 sm:p-4 border border-green-400/30 text-center">
                      <div className="flex items-center justify-center mb-1 sm:mb-2">
                        <Users className="w-4 h-4 sm:w-6 sm:h-6 text-green-400 mr-1 sm:mr-2" />
                        <span className="text-lg sm:text-2xl font-bold text-green-300">{queueDisplay.total_waiting}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-green-200">คนในคิวที่กำลังดำเนินการ</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 backdrop-blur-sm rounded-xl p-2 sm:p-4 border border-red-400/30 text-center">
                      <div className="flex items-center justify-center mb-1 sm:mb-2">
                        <AlertCircle className="w-4 h-4 sm:w-6 sm:h-6 text-red-400 mr-1 sm:mr-2" />
                        <span className="text-lg sm:text-2xl font-bold text-red-300">{queueDisplay.total_problems}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-red-200">คิวมีปัญหา</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500/20 to-yellow-500/20 backdrop-blur-sm rounded-xl p-2 sm:p-4 border border-orange-400/30 text-center">
                      <div className="flex items-center justify-center mb-1 sm:mb-2">
                        <Clock className="w-4 h-4 sm:w-6 sm:h-6 text-orange-400 mr-1 sm:mr-2" />
                        <span className="text-sm sm:text-lg font-bold text-orange-300">{formatWaitTime(queueDisplay.average_wait_time)}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-orange-200">เวลารอโดยประมาณ</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-xl p-2 sm:p-4 border border-purple-400/30 text-center">
                      <div className="flex items-center justify-center mb-1 sm:mb-2">
                        <Play className="w-4 h-4 sm:w-6 sm:h-6 text-purple-400 mr-1 sm:mr-2" />
                        <span className="text-xs sm:text-sm font-bold text-purple-300">
                          {queueDisplay.current_processing ? 'กำลังดำเนินการ' : 'รอเริ่มงาน'}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-purple-200">สถานะปัจจุบัน</p>
                    </div>
                  </div>

                  {/* คิวที่กำลังดำเนินการ */}
                  {queueDisplay.current_processing && (
                    <div className="bg-gradient-to-br from-red-500/30 to-pink-500/30 backdrop-blur-sm rounded-2xl p-4 border border-red-400/30 text-center">
                      <div className="text-3xl sm:text-4xl font-bold text-white mb-2 drop-shadow-lg">
                        #{queueDisplay.current_processing.queue_number}
                      </div>
                      <div className="flex items-center justify-center mb-2">
                        <span className="text-lg sm:text-xl mr-2">{getProductTypeInfo(queueDisplay.current_processing.product_type).icon}</span>
                        <span className="text-sm sm:text-base text-white">{getProductTypeInfo(queueDisplay.current_processing.product_type).name}</span>
                      </div>
                      {queueDisplay.current_processing.customer_name && (
                        <p className="text-xs text-red-200">{queueDisplay.current_processing.customer_name}</p>
                      )}
                    </div>
                  )}

                  {/* คิว 3 อันดับถัดไป */}
                  <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-400/30">
                    <div className="text-center mb-4">
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-2">📋 คิวถัดไป</h3>
                    </div>
                    
                    {queueDisplay.next_3_items.filter(item => {
                      if (!searchTerm.trim()) return true;
                      const searchLower = searchTerm.toLowerCase();
                      return (
                        item.queue_number.toString().includes(searchLower) ||
                        (item.roblox_username && item.roblox_username.toLowerCase().includes(searchLower)) ||
                        (item.customer_name && item.customer_name.toLowerCase().includes(searchLower)) ||
                        item.contact_info.toLowerCase().includes(searchLower)
                      );
                    }).length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400 opacity-50" />
                        <p className="text-lg text-white">ไม่มีคิวที่รออยู่</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {queueDisplay.next_3_items
                          .filter(item => {
                            if (!searchTerm.trim()) return true;
                            const searchLower = searchTerm.toLowerCase();
                            return (
                              item.queue_number.toString().includes(searchLower) ||
                              (item.roblox_username && item.roblox_username.toLowerCase().includes(searchLower)) ||
                              (item.customer_name && item.customer_name.toLowerCase().includes(searchLower)) ||
                              item.contact_info.toLowerCase().includes(searchLower)
                            );
                          })
                          .slice(0, 3)
                          .map((item, index) => (
                          <div key={item.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
                            <div className="text-2xl font-bold text-white mb-1">#{item.queue_number}</div>
                            <div className="flex items-center justify-center mb-1">
                              <span className="text-lg mr-1">{getProductTypeInfo(item.product_type).icon}</span>
                              <span className="text-xs text-purple-200">{getProductTypeInfo(item.product_type).name}</span>
                            </div>
                            <Badge className="bg-blue-500/50 text-blue-200 border-blue-400/30 rounded-full px-2 py-1 text-xs">
                              อันดับที่ {index + 1}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ข้อความแนะนำ */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/20 shadow-2xl">
          <div className="text-center space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="bg-blue-500/20 rounded-full px-3 py-1 sm:px-4 sm:py-2 border border-blue-400/30">
                <span className="text-blue-300 text-xs sm:text-sm">💡 หมายเลขคิวจะได้รับเมื่อคุณทำการรีดีมสินค้า</span>
              </div>
              <div className="bg-purple-500/20 rounded-full px-3 py-1 sm:px-4 sm:py-2 border border-purple-400/30">
                <span className="text-purple-300 text-xs sm:text-sm">📞 หากมีปัญหา กรุณาติดต่อแอดมิน</span>
              </div>
            </div>

            {/* ข้อความเตือนเรื่องคิวที่มีปัญหา */}
            {queueDisplay && queueDisplay.total_problems > 0 && (
              <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-red-400/30">
                <div className="flex items-center justify-center mb-2">
                  <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 mr-2" />
                  <span className="text-red-300 font-semibold text-sm sm:text-base">⚠️ มีคิวที่มีปัญหา {queueDisplay.total_problems} รายการ</span>
                </div>
                <div className="text-red-200 text-xs sm:text-sm space-y-1">
                  <p>หากคุณได้รับสินค้าล่าช้าหรือนานเกินไป กรุณา:</p>
                  <div className="flex flex-col sm:flex-row justify-center items-center space-y-1 sm:space-y-0 sm:space-x-4">
                    <span>1. ใส่ชื่อตัวเองในช่องค้นหา</span>
                    <span>2. ตรวจสอบว่าคิวตัวเองมีปัญหาหรือไม่</span>
                  </div>
                  <p className="text-red-100">หากพบว่าคิวของคุณมีปัญหา กรุณาติดต่อแอดมินทันที</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>


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
    </div>
  );
}
