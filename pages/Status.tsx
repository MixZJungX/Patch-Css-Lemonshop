import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { RedemptionRequest } from '@/types';
import { Link } from 'react-router-dom';

export default function Status() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState<RedemptionRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error('กรุณาใส่ชื่อผู้ใช้หรือข้อมูลติดต่อ');
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      // Try new namespace first (Robux requests)
      let { data, error } = await supabase
        .from('app_284beb8f90_redemption_requests')
        .select('*')
        .or(`roblox_username.ilike.%${searchTerm}%,contact_info.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // If not found, try Rainbow Six requests
      if (error && error.code === 'PGRST116') {
        const { data: rainbowData, error: rainbowError } = await supabase
          .from('app_284beb8f90_rainbow_requests')
          .select('*')
          .or(`user_name.ilike.%${searchTerm}%,user_email.ilike.%${searchTerm}%,user_phone.ilike.%${searchTerm}%`)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (rainbowError && rainbowError.code !== 'PGRST116') {
          throw rainbowError;
        }

        if (rainbowData) {
          // Transform Rainbow Six data to match RedemptionRequest format
          data = {
            id: rainbowData.id,
            roblox_username: rainbowData.user_name || rainbowData.discord_username,
            robux_amount: rainbowData.credits_requested || 0,
            contact_info: `Rainbow Six: ${rainbowData.user_name} | Email: ${rainbowData.user_email} | Phone: ${rainbowData.user_phone}`,
            status: rainbowData.status,
            admin_notes: rainbowData.admin_notes,
            created_at: rainbowData.created_at,
            updated_at: rainbowData.updated_at,
            type: 'rainbow'
          };
          error = null;
        }
      }

      // If still not found, try old namespace as fallback
      if (error && error.code === 'PGRST116') {
        const { data: oldData, error: oldError } = await supabase
          .from('app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_redemption_requests')
          .select('*')
          .or(`roblox_username.ilike.%${searchTerm}%,contact_info.ilike.%${searchTerm}%`)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (oldError && oldError.code !== 'PGRST116') {
          throw oldError;
        }

        if (oldData) {
          data = oldData;
          error = null;
        }
      }

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setSearchResult(data || null);
      
      if (!data) {
        toast.error('ไม่พบข้อมูลคำขอ');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('เกิดข้อผิดพลาดในการค้นหา');
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: 'รอดำเนินการ', color: 'bg-yellow-500/20 text-yellow-300', icon: '⏳' };
      case 'processing':
        return { text: 'กำลังดำเนินการ', color: 'bg-blue-500/20 text-blue-300', icon: '🔄' };
      case 'completed':
        return { text: 'เสร็จสิ้น', color: 'bg-green-500/20 text-green-300', icon: '✅' };
      case 'rejected':
        return { text: 'ยกเลิก', color: 'bg-red-500/20 text-red-300', icon: '❌' };
      default:
        return { text: 'ไม่ทราบสถานะ', color: 'bg-gray-500/20 text-gray-300', icon: '❓' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl">
                <span className="text-3xl">🔍</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  ตรวจสอบสถานะ
                </h1>
                <p className="text-blue-200 text-sm">เช็คสถานะคำขอแลกโค้ดของคุณ</p>
              </div>
            </div>
            <Link to="/">
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                🏠 กลับหน้าหลัก
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Search Form */}
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 mb-8">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white flex items-center justify-center space-x-2">
                <span className="text-3xl">🔍</span>
                <span>ค้นหาสถานะคำขอ</span>
              </CardTitle>
              <p className="text-blue-200">ใส่ชื่อผู้ใช้ Roblox, Rainbow Six หรือข้อมูลติดต่อที่ใช้ส่งคำขอ</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                                  <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ชื่อผู้ใช้ Roblox, Rainbow Six หรือข้อมูลติดต่อ"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-lg p-4"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
              </div>
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 text-lg"
              >
                {loading ? 'กำลังค้นหา...' : '🔍 ค้นหาสถานะ'}
              </Button>
            </CardContent>
          </Card>

          {/* Search Results */}
          {searched && (
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <span className="text-2xl">📋</span>
                  <span>ผลการค้นหา</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {searchResult ? (
                  <div className="space-y-6">
                    {/* Status Card */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-white">สถานะคำขอ</h3>
                        <Badge className={getStatusInfo(searchResult.status).color + ' text-lg px-4 py-2'}>
                          {getStatusInfo(searchResult.status).icon} {getStatusInfo(searchResult.status).text}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white">
                        <div>
                          <p className="text-sm text-white/60 mb-1">
                            {searchResult.type === 'rainbow' ? 'ชื่อผู้ใช้' : 'ชื่อผู้ใช้ Roblox'}
                          </p>
                          <p className="font-semibold">{searchResult.roblox_username}</p>
                        </div>
                        <div>
                          <p className="text-sm text-white/60 mb-1">ประเภทคำขอ</p>
                          <p className="font-semibold">
                            {searchResult.type === 'rainbow' 
                              ? `${searchResult.robux_amount} Rainbow Six Credits`
                              : searchResult.robux_amount > 0 
                                ? `${searchResult.robux_amount} Robux` 
                                : 'บัญชีไก่ตัน'
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-white/60 mb-1">วันที่ส่งคำขอ</p>
                          <p className="font-semibold">
                            {new Date(searchResult.created_at).toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-white/60 mb-1">อัพเดทล่าสุด</p>
                          <p className="font-semibold">
                            {new Date(searchResult.updated_at).toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>

                      {searchResult.admin_notes && (
                        <div className="mt-4 p-4 bg-white/10 rounded-lg">
                          <p className="text-sm text-white/60 mb-2">หมายเหตุจากแอดมิน</p>
                          <p className="text-white">{searchResult.admin_notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Status Timeline */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                      <h3 className="text-xl font-bold text-white mb-4">ขั้นตอนการดำเนินการ</h3>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">✓</span>
                          </div>
                          <div className="text-white">
                            <p className="font-semibold">ส่งคำขอเรียบร้อย</p>
                            <p className="text-sm text-white/60">คำขอของคุณได้รับการบันทึกในระบบแล้ว</p>
                          </div>
                        </div>
                        
                        <div className={`flex items-center space-x-4 ${['processing', 'completed'].includes(searchResult.status) ? 'opacity-100' : 'opacity-50'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${['processing', 'completed'].includes(searchResult.status) ? 'bg-blue-500' : 'bg-gray-500'}`}>
                            <span className="text-white text-sm">{['processing', 'completed'].includes(searchResult.status) ? '✓' : '○'}</span>
                          </div>
                          <div className="text-white">
                            <p className="font-semibold">กำลังดำเนินการ</p>
                            <p className="text-sm text-white/60">แอดมินได้เริ่มดำเนินการคำขอของคุณแล้ว</p>
                          </div>
                        </div>
                        
                        <div className={`flex items-center space-x-4 ${searchResult.status === 'completed' ? 'opacity-100' : 'opacity-50'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${searchResult.status === 'completed' ? 'bg-green-500' : 'bg-gray-500'}`}>
                            <span className="text-white text-sm">{searchResult.status === 'completed' ? '✓' : '○'}</span>
                          </div>
                          <div className="text-white">
                            <p className="font-semibold">เสร็จสิ้น</p>
                            <p className="text-sm text-white/60">คำขอของคุณได้รับการดำเนินการเรียบร้อยแล้ว</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                      <p className="text-blue-200 text-sm">
                        <strong>💡 คำแนะนำ:</strong> หากคำขอของคุณอยู่ในสถานะ "เสร็จสิ้น" แต่ยังไม่ได้รับของรางวัล 
                        กรุณาติดต่อแอดมินผ่านช่องทางที่ท่านระบุไว้ในคำขอ
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">😔</div>
                    <h3 className="text-xl font-bold text-white mb-2">ไม่พบข้อมูลคำขอ</h3>
                    <p className="text-white/60 mb-6">
                      ไม่พบคำขอที่ตรงกับข้อมูลที่ค้นหา กรุณาตรวจสอบการพิมพ์หรือลองใช้ข้อมูลอื่น
                    </p>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                      <p className="text-yellow-200 text-sm">
                        <strong>💡 เคล็ดลับการค้นหา:</strong><br/>
                        • ใช้ชื่อผู้ใช้ Roblox ที่ใช้ส่งคำขอ<br/>
                        • ใช้ชื่อผู้ใช้ Rainbow Six ที่ใช้ส่งคำขอ<br/>
                        • ใช้ข้อมูลติดต่อ (Discord, Line ID, Email, เบอร์โทร) ที่ระบุในคำขอ<br/>
                        • ตรวจสอบการพิมพ์ให้ถูกต้อง
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Help Section */}
          {!searched && (
            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">🆘 ช่วยเหลือ</h3>
                <div className="space-y-3 text-white/80">
                  <p><strong>วิธีการค้นหา:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>ใส่ชื่อผู้ใช้ Roblox ที่ใช้ส่งคำขอ</li>
                    <li>ใส่ชื่อผู้ใช้ Rainbow Six ที่ใช้ส่งคำขอ</li>
                    <li>หรือใส่ข้อมูลติดต่อ (Discord, Line ID, Email, เบอร์โทร) ที่ระบุในคำขอ</li>
                  </ul>
                  <p className="text-sm mt-4"><strong>หมายเหตุ:</strong> ระบบจะแสดงคำขอล่าสุดที่ตรงกับข้อมูลที่ค้นหา</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}