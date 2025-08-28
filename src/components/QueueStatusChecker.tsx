import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QueueItem, QueueDisplay } from '@/types';
import { checkQueueStatus, getQueuePosition, getQueueDisplay } from '@/lib/queueApi';
import { Search, Clock, CheckCircle, XCircle, AlertCircle, Users, Play } from 'lucide-react';

export default function QueueStatusChecker() {
  const [queueNumber, setQueueNumber] = useState('');
  const [queueItem, setQueueItem] = useState<QueueItem | null>(null);
  const [queuePosition, setQueuePosition] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [queueDisplay, setQueueDisplay] = useState<QueueDisplay | null>(null);

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
      setError('กรุณากรอกหมายเลขคิว');
      return;
    }

    const number = parseInt(queueNumber);
    if (isNaN(number) || number < 1) {
      setError('หมายเลขคิวต้องเป็นตัวเลขบวก');
      return;
    }

    setLoading(true);
    setError('');
    setQueueItem(null);

    try {
      const result = await checkQueueStatus(number);
      if (result) {
        setQueueItem(result);
        
        if (result.status === 'waiting') {
          const position = await getQueuePosition(number);
          setQueuePosition(position);
        } else {
          setQueuePosition(0);
        }
      } else {
        setError('ไม่พบหมายเลขคิวนี้ กรุณาตรวจสอบอีกครั้ง');
      }
    } catch (err) {
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
      default: return { icon: <Clock className="w-5 h-5" />, color: 'bg-gray-500', text: 'ไม่ทราบสถานะ', description: 'ไม่สามารถระบุสถานะได้' };
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="w-full max-w-7xl mx-auto p-6 space-y-8">
        {/* หัวข้อหลัก */}
        <div className="text-center space-y-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
            <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              🎯 ระบบคิว
            </h1>
            <p className="text-2xl text-purple-200 font-medium">Thai Robux Redemption System</p>
            <div className="mt-6 flex justify-center space-x-4">
              <div className="bg-green-500/20 rounded-full px-4 py-2 border border-green-400/30">
                <span className="text-green-300 text-sm">🟢 ระบบพร้อมใช้งาน</span>
              </div>
              <div className="bg-blue-500/20 rounded-full px-4 py-2 border border-blue-400/30">
                <span className="text-blue-300 text-sm">⚡ Real-time Updates</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ด้านซ้าย: เช็คสถานะคิว */}
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-white mb-2">🔍 เช็คสถานะคิว</h2>
                <p className="text-purple-200">ตรวจสอบสถานะและตำแหน่งในคิวของคุณ</p>
              </div>
              
              <div className="space-y-6">
                <div className="flex gap-3">
                  <Input
                    type="number"
                    placeholder="กรอกหมายเลขคิว (เช่น: 1, 2, 3...)"
                    value={queueNumber}
                    onChange={(e) => setQueueNumber(e.target.value)}
                    className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-purple-300 rounded-2xl"
                    min="1"
                  />
                  <Button 
                    onClick={handleCheckStatus} 
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl px-6"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        กำลังตรวจสอบ...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Search className="w-4 h-4 mr-2" />
                        ตรวจสอบ
                      </div>
                    )}
                  </Button>
                </div>

                {error && (
                  <Alert className="border-red-400/30 bg-red-500/10 backdrop-blur-sm rounded-2xl">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-300">{error}</AlertDescription>
                  </Alert>
                )}

                {queueItem && (
                  <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-3xl p-6 border border-white/20">
                    <div className="text-center mb-6">
                      <div className="text-7xl font-bold text-white mb-3 drop-shadow-lg">
                        #{queueItem.queue_number}
                      </div>
                      <div className="flex items-center justify-center mb-3">
                        <span className="text-3xl mr-3">{getProductTypeInfo(queueItem.product_type).icon}</span>
                        <span className="text-xl font-semibold text-white">{getProductTypeInfo(queueItem.product_type).name}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between bg-white/10 rounded-2xl p-4">
                        <span className="font-medium text-purple-200">สถานะ:</span>
                        <Badge className={`${getStatusInfo(queueItem.status).color} text-white rounded-full px-4 py-2`}>
                          <div className="flex items-center">
                            {getStatusInfo(queueItem.status).icon}
                            <span className="ml-2">{getStatusInfo(queueItem.status).text}</span>
                          </div>
                        </Badge>
                      </div>

                      {queueItem.customer_name && (
                        <div className="flex items-center justify-between bg-white/10 rounded-2xl p-4">
                          <span className="font-medium text-purple-200">ชื่อลูกค้า:</span>
                          <span className="text-white">{queueItem.customer_name}</span>
                        </div>
                      )}

                      {queueItem.contact_info && (
                        <div className="flex items-center justify-between bg-white/10 rounded-2xl p-4">
                          <span className="font-medium text-purple-200">ข้อมูลติดต่อ:</span>
                          <span className="text-white">{queueItem.contact_info}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between bg-white/10 rounded-2xl p-4">
                        <span className="font-medium text-purple-200">วันที่สร้างคิว:</span>
                        <span className="text-white">{formatDate(queueItem.created_at)}</span>
                      </div>

                      {queueItem.status === 'waiting' && queuePosition > 0 && (
                        <div className="flex items-center justify-between bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl p-4 border border-yellow-400/30">
                          <span className="font-medium text-yellow-200">ตำแหน่งในคิว:</span>
                          <span className="font-bold text-2xl text-yellow-300">ลำดับที่ {queuePosition}</span>
                        </div>
                      )}
                      
                      {queueItem.estimated_wait_time && queueItem.status === 'waiting' && (
                        <div className="flex items-center justify-between bg-white/10 rounded-2xl p-4">
                          <span className="font-medium text-purple-200">เวลารอโดยประมาณ:</span>
                          <span className="text-white font-semibold">{queueItem.estimated_wait_time} นาที</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 bg-blue-500/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-400/30">
                      <p className="text-sm text-blue-200 text-center">💡 {getStatusInfo(queueItem.status).description}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ด้านขวา: จอแสดงคิว */}
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-white mb-2">📺 จอแสดงคิว</h2>
                <p className="text-purple-200">ติดตามสถานะคิวแบบ Real-time</p>
              </div>
              
              {!queueDisplay ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                  <p className="text-purple-200">กำลังโหลดข้อมูล...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* สถิติรวม */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-2xl p-4 border border-green-400/30 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Users className="w-6 h-6 text-green-400 mr-2" />
                        <span className="text-2xl font-bold text-green-300">{queueDisplay.total_waiting}</span>
                      </div>
                      <p className="text-sm text-green-200">คนในคิว</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500/20 to-yellow-500/20 backdrop-blur-sm rounded-2xl p-4 border border-orange-400/30 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Clock className="w-6 h-6 text-orange-400 mr-2" />
                        <span className="text-lg font-bold text-orange-300">{formatWaitTime(queueDisplay.average_wait_time)}</span>
                      </div>
                      <p className="text-sm text-orange-200">เวลารอโดยประมาณ</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl p-4 border border-purple-400/30 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Play className="w-6 h-6 text-purple-400 mr-2" />
                        <span className="text-sm font-bold text-purple-300">
                          {queueDisplay.current_processing ? 'กำลังดำเนินการ' : 'รอเริ่มงาน'}
                        </span>
                      </div>
                      <p className="text-sm text-purple-200">สถานะปัจจุบัน</p>
                    </div>
                  </div>

                  {/* คิวที่กำลังดำเนินการ */}
                  {queueDisplay.current_processing && (
                    <div className="bg-gradient-to-br from-red-500/30 to-pink-500/30 backdrop-blur-sm rounded-3xl p-6 border border-red-400/30 text-center">
                      <div className="text-5xl font-bold text-white mb-3 drop-shadow-lg">
                        #{queueDisplay.current_processing.queue_number}
                      </div>
                      <div className="flex items-center justify-center mb-3">
                        <span className="text-2xl mr-3">{getProductTypeInfo(queueDisplay.current_processing.product_type).icon}</span>
                        <span className="text-lg text-white">{getProductTypeInfo(queueDisplay.current_processing.product_type).name}</span>
                      </div>
                      {queueDisplay.current_processing.customer_name && (
                        <p className="text-sm text-red-200">{queueDisplay.current_processing.customer_name}</p>
                      )}
                    </div>
                  )}

                  {/* คิว 3 อันดับถัดไป */}
                  <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-sm rounded-3xl p-6 border border-blue-400/30">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-white mb-2">📋 คิวถัดไป</h3>
                    </div>
                    
                    {queueDisplay.next_3_items.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400 opacity-50" />
                        <p className="text-lg text-white">ไม่มีคิวที่รออยู่</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {queueDisplay.next_3_items.map((item, index) => (
                          <div key={item.id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">
                            <div className="text-3xl font-bold text-white mb-2">#{item.queue_number}</div>
                            <div className="flex items-center justify-center mb-2">
                              <span className="text-xl mr-2">{getProductTypeInfo(item.product_type).icon}</span>
                              <span className="text-sm text-purple-200">{getProductTypeInfo(item.product_type).name}</span>
                            </div>
                            <Badge className="bg-blue-500/50 text-blue-200 border-blue-400/30 rounded-full px-3 py-1">
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
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
          <div className="text-center space-y-3">
            <div className="flex justify-center space-x-4">
              <div className="bg-blue-500/20 rounded-full px-4 py-2 border border-blue-400/30">
                <span className="text-blue-300 text-sm">💡 หมายเลขคิวจะได้รับเมื่อคุณทำการรีดีมสินค้า</span>
              </div>
              <div className="bg-purple-500/20 rounded-full px-4 py-2 border border-purple-400/30">
                <span className="text-purple-300 text-sm">📞 หากมีปัญหา กรุณาติดต่อแอดมิน</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
