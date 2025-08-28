import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QueueDisplay as QueueDisplayType } from '@/types';
import { getQueueDisplay } from '@/lib/queueApi';
import { Clock, Users, Play, CheckCircle } from 'lucide-react';

export default function QueueDisplay() {
  const [queueData, setQueueData] = useState<QueueDisplayType | null>(null);
  const [loading, setLoading] = useState(true);

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
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto bg-gradient-to-r from-blue-900 to-purple-900 text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">🔄 กำลังโหลดข้อมูลคิว...</CardTitle>
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
            {queueData.current_processing.customer_name && (
              <p className="text-lg opacity-90">
                {queueData.current_processing.customer_name}
              </p>
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
          {queueData.next_3_items.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-xl">ไม่มีคิวที่รออยู่</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {queueData.next_3_items.map((item, index) => (
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
          <p className="text-sm opacity-80">
            💡 หมายเลขคิวจะถูกเรียกตามลำดับ กรุณารอการเรียก
          </p>
          <p className="text-xs opacity-60 mt-2">
            อัปเดตล่าสุด: {new Date().toLocaleString('th-TH')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
