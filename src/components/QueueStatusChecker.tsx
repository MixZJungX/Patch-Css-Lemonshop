import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QueueItem, QueueDisplay } from '@/types';
import { getQueuePosition, getQueueDisplay, searchQueueByGameInfo } from '@/lib/queueApi';
import { testSimpleSearch } from '@/lib/testSearch';
import { Search, Clock, CheckCircle, XCircle, AlertCircle, Users, Play, MessageSquare, X, MessageCircle, Home, ArrowLeft } from 'lucide-react';
import { ChatWidget } from './ChatWidget';
import { Link } from 'react-router-dom';

export default function QueueStatusChecker() {
  const [queueNumber, setQueueNumber] = useState('');
  const [queueItem, setQueueItem] = useState<QueueItem | null>(null);
  const [queuePosition, setQueuePosition] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [queueDisplay, setQueueDisplay] = useState<QueueDisplay | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<QueueItem[]>([]);

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
                            onClick={() => setIsChatOpen(true)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1 text-xs sm:text-sm"
                          >
                            <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            <span className="hidden sm:inline">แชทกับแอดมิน</span>
                            <span className="sm:hidden">แชท</span>
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

                    {/* ปุ่มติดต่อแอดมินเมื่อมีปัญหา */}
                    {queueItem.status === 'problem' && (
                      <div className="mt-3 bg-orange-500/20 backdrop-blur-sm rounded-xl p-3 border border-orange-400/30">
                        <div className="text-center space-y-2">
                          <p className="text-xs text-orange-200">⚠️ คิวของคุณมีปัญหา กรุณาติดต่อแอดมินเพื่อขอความช่วยเหลือ</p>
                          <Button
                            onClick={() => setIsChatOpen(true)}
                            className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg px-4 py-2 text-sm"
                          >
                            <MessageCircle className="h-3 w-3 mr-1" />
                            ติดต่อแอดมิน
                          </Button>
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

      {/* Chat Widget */}
      <ChatWidget
        customerId={queueItem?.queue_number?.toString() || (queueNumber || 'GUEST').trim().toLowerCase()}
        customerName={`ลูกค้าคิว #${queueItem?.queue_number || (queueNumber || 'GUEST').trim()}`}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
}
