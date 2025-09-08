import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QueueDisplay as QueueDisplayType } from '@/types';
import { getQueueDisplay } from '@/lib/queueApi';
import { Clock, Users, Play, CheckCircle, Search, X } from 'lucide-react';

export default function QueueDisplay() {
  const [queueData, setQueueData] = useState<QueueDisplayType | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadQueueData = async () => {
    try {
      const data = await getQueueDisplay();
      setQueueData(data);
    } catch (error) {
      console.error('Error loading queue data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueueData();
    
    // อัปเดตข้อมูลทุก 10 วินาที
    const interval = setInterval(loadQueueData, 10000);
    
    // อัปเดตทันทีเมื่อหน้าถูกเปิด
    const updateImmediately = () => {
      loadQueueData();
    };
    
    // ฟัง event เมื่อหน้าได้รับ focus
    window.addEventListener('focus', updateImmediately);
    window.addEventListener('visibilitychange', updateImmediately);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', updateImmediately);
      window.removeEventListener('visibilitychange', updateImmediately);
    };
  }, []);

  if (loading) {
      return (
    <Card className="w-full max-w-4xl mx-auto bg-gradient-to-r from-blue-900 to-purple-900 text-white">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">🔄 กำลังโหลดข้อมูลคิว...</CardTitle>
        <p className="text-blue-200 mt-2">กรุณารอสักครู่ ข้อมูลจะอัปเดตโดยอัตโนมัติ</p>
      </CardHeader>
    </Card>
  );
  }

  if (!queueData) {
    return (
      <Card className="w-full max-w-4xl mx-auto bg-gradient-to-r from-red-900 to-orange-900 text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">❌ ไม่สามารถโหลดข้อมูลคิวได้</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const formatWaitTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} นาที`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} ชั่วโมง ${remainingMinutes} นาที`;
  };

  const getProductTypeIcon = (type: string) => {
    switch (type) {
      case 'robux': return '🎮';
      case 'chicken': return '🐔';
      case 'rainbow': return '🌈';
      default: return '📦';
    }
  };

  const getProductTypeName = (type: string) => {
    switch (type) {
      case 'robux': return 'Robux';
      case 'chicken': return 'Chicken';
      case 'rainbow': return 'Rainbow Six';
      default: return 'สินค้า';
    }
  };

  // Filter queue items based on search term
  const filteredNextItems = queueData.next_items?.filter(item => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      item.queue_number.toString().includes(searchLower) ||
      (item.roblox_username && item.roblox_username.toLowerCase().includes(searchLower)) ||
      (item.customer_name && item.customer_name.toLowerCase().includes(searchLower)) ||
      item.contact_info.toLowerCase().includes(searchLower)
    );
  }) || [];

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* หัวข้อหลัก */}
      <Card className="bg-gradient-to-r from-blue-900 to-purple-900 text-white mb-6">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold">🎯 ระบบคิว</CardTitle>
          <p className="text-xl opacity-90">Thai Robux Redemption System</p>
        </CardHeader>
      </Card>

      {/* สถิติรวม */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="w-6 h-6 mr-2" />
              <span className="text-2xl font-bold">{queueData.total_waiting}</span>
            </div>
            <p className="text-sm">คนในคิว</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-600 to-orange-700 text-white">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-6 h-6 mr-2" />
              <span className="text-2xl font-bold">{formatWaitTime(queueData.average_wait_time)}</span>
            </div>
            <p className="text-sm">เวลารอโดยประมาณ</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Play className="w-6 h-6 mr-2" />
              <span className="text-2xl font-bold">
                {queueData.current_processing ? 'กำลังดำเนินการ' : 'รอเริ่มงาน'}
              </span>
            </div>
            <p className="text-sm">สถานะปัจจุบัน</p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="bg-gray-800/50 border-gray-600/50 mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="ค้นหาคิว... (หมายเลขคิว, ชื่อ, เบอร์โทร)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* คิวที่กำลังดำเนินการ */}
      {queueData.current_processing && (
        <Card className="bg-gradient-to-r from-red-600 to-red-700 text-white mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              🎯 กำลังดำเนินการ
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-6xl font-bold mb-2">
              #{queueData.current_processing.queue_number}
            </div>
            <div className="flex items-center justify-center mb-2">
              <span className="text-2xl mr-2">
                {getProductTypeIcon(queueData.current_processing.product_type)}
              </span>
              <span className="text-xl">
                {getProductTypeName(queueData.current_processing.product_type)}
              </span>
            </div>
            {(queueData.current_processing.roblox_username || queueData.current_processing.customer_name) && (
              <div className="space-y-2">
                <p className="text-lg opacity-90">
                  {queueData.current_processing.roblox_username || queueData.current_processing.customer_name}
                </p>
                {queueData.current_processing.robux_amount && (
                  <p className="text-sm opacity-75">
                    💎 {queueData.current_processing.robux_amount} Robux
                  </p>
                )}
                {queueData.current_processing.assigned_code && (
                  <p className="text-sm opacity-75">
                    🎫 Code: {queueData.current_processing.assigned_code}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* คิว 3 อันดับถัดไป */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            📋 คิวถัดไป
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredNextItems.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-xl">ไม่มีคิวที่รออยู่</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredNextItems.slice(0, 3).map((item, index) => (
                <Card key={item.id} className="bg-white/10 border-white/20">
                  <CardContent className="p-4 text-center">
                    <div className="text-4xl font-bold mb-2">
                      #{item.queue_number}
                    </div>
                    <div className="flex items-center justify-center mb-2">
                      <span className="text-xl mr-2">
                        {getProductTypeIcon(item.product_type)}
                      </span>
                      <span className="text-sm">
                        {getProductTypeName(item.product_type)}
                      </span>
                    </div>
                    
                    {/* แสดงข้อมูลลูกค้า */}
                    {(item.roblox_username || item.customer_name) && (
                      <div className="text-xs opacity-80 mb-2">
                        👤 {item.roblox_username || item.customer_name}
                      </div>
                    )}
                    
                    {item.robux_amount && (
                      <div className="text-xs opacity-80 mb-2">
                        💎 {item.robux_amount} Robux
                      </div>
                    )}
                    
                    <Badge variant="secondary" className="text-xs">
                      อันดับที่ {index + 1}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ข้อความด้านล่าง */}
      <Card className="mt-6 bg-gradient-to-r from-gray-800 to-gray-900 text-white">
        <CardContent className="p-4 text-center">
          <p className="text-sm opacity-80 mb-2">
            💡 หมายเลขคิวจะถูกเรียกตามลำดับ กรุณารอการเรียก
          </p>
          <div className="bg-blue-500/20 backdrop-blur-sm rounded-2xl p-3 border border-blue-400/30 mb-2">
            <p className="text-blue-200 text-sm">
              🎯 <strong>หมายเหตุ:</strong> หลังจากแลกโค้ดเสร็จ คิวของคุณจะปรากฏในรายการทันที
            </p>
          </div>
          <p className="text-xs opacity-60">
            อัปเดตล่าสุด: {new Date().toLocaleString('th-TH')} | อัปเดตทุก 10 วินาที
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
