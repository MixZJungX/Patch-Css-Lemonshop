import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QueueItem } from '@/types';
import { getAllQueueItems, updateQueueStatus } from '@/lib/queueApi';
import { toast } from 'sonner';
import { Play, CheckCircle, XCircle, Clock, RefreshCw, Edit, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function QueueManager() {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [updateStatus, setUpdateStatus] = useState<'processing' | 'completed' | 'cancelled'>('processing');
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [codesData, setCodesData] = useState<{[key: string]: any}>({});

  const loadQueueItems = async () => {
    try {
      setLoading(true);
      const items = await getAllQueueItems();
      setQueueItems(items);
      
      // ดึงข้อมูลรหัสและโค้ดสำหรับแต่ละคิว
      const codesDataTemp: {[key: string]: any} = {};
      
      for (const item of items) {
        if (item.redemption_request_id) {
          try {
            // ดึงข้อมูล redemption request
            const { data: requestData } = await supabase
              .from('redemption_requests')
              .select('*')
              .eq('id', item.redemption_request_id)
              .single();
            
            if (requestData) {
              codesDataTemp[item.id] = {
                request: requestData,
                codes: [],
                accounts: []
              };
              
              // ดึงข้อมูลโค้ด Robux
              if (requestData.assigned_code) {
                const { data: codeData } = await supabase
                  .from('redemption_codes')
                  .select('*')
                  .eq('code', requestData.assigned_code)
                  .single();
                
                if (codeData) {
                  codesDataTemp[item.id].codes.push(codeData);
                }
              }
              
              // ดึงข้อมูลบัญชี Chicken
              if (requestData.assigned_account_code) {
                const { data: accountData } = await supabase
                  .from('chicken_accounts')
                  .select('*')
                  .eq('code', requestData.assigned_account_code)
                  .single();
                
                if (accountData) {
                  codesDataTemp[item.id].accounts.push(accountData);
                }
              }
            }
          } catch (error) {
            console.error('Error loading codes for queue item:', item.id, error);
          }
        }
      }
      
      setCodesData(codesDataTemp);
    } catch (error) {
      console.error('Error loading queue items:', error);
      toast.error('ไม่สามารถโหลดข้อมูลคิวได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueueItems();
    const interval = setInterval(loadQueueItems, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'waiting': return { icon: <Clock className="w-4 h-4" />, color: 'bg-yellow-500', text: 'รอ' };
      case 'processing': return { icon: <Play className="w-4 h-4" />, color: 'bg-blue-500', text: 'กำลังดำเนินการ' };
      case 'completed': return { icon: <CheckCircle className="w-4 h-4" />, color: 'bg-green-500', text: 'เสร็จสิ้น' };
      case 'cancelled': return { icon: <XCircle className="w-4 h-4" />, color: 'bg-red-500', text: 'ยกเลิก' };
      default: return { icon: <Clock className="w-4 h-4" />, color: 'bg-gray-500', text: 'ไม่ทราบ' };
    }
  };

  const getProductTypeInfo = (type: string) => {
    switch (type) {
      case 'robux': return { icon: '🎮', name: 'Robux' };
      case 'chicken': return { icon: '🐔', name: 'Chicken' };
      case 'rainbow': return { icon: '🌈', name: 'Rainbow Six' };
      default: return { icon: '📦', name: 'สินค้า' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleUpdateStatus = async () => {
    if (!selectedItem) return;
    
    setIsUpdating(true);
    try {
      await updateQueueStatus(selectedItem.id, updateStatus, adminNotes);
      toast.success('อัปเดตสถานะคิวสำเร็จ');
      setShowUpdateDialog(false);
      setSelectedItem(null);
      setUpdateStatus('processing');
      setAdminNotes('');
      loadQueueItems();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการอัปเดต');
    } finally {
      setIsUpdating(false);
    }
  };

  const openUpdateDialog = (item: QueueItem) => {
    setSelectedItem(item);
    setUpdateStatus(item.status as 'processing' | 'completed' | 'cancelled');
    setAdminNotes(item.admin_notes || '');
    setShowUpdateDialog(true);
  };

  const waitingCount = queueItems.filter(item => item.status === 'waiting').length;
  const processingCount = queueItems.filter(item => item.status === 'processing').length;
  const completedCount = queueItems.filter(item => item.status === 'completed').length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">🎯 จัดการระบบคิว</CardTitle>
            <Button onClick={loadQueueItems} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{waitingCount}</div>
              <div className="text-sm text-yellow-700">รอการดำเนินการ</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{processingCount}</div>
              <div className="text-sm text-blue-700">กำลังดำเนินการ</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{completedCount}</div>
              <div className="text-sm text-green-700">เสร็จสิ้น</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">{queueItems.length}</div>
              <div className="text-sm text-gray-700">ทั้งหมด</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-white">รายการคิวทั้งหมด</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
              <p className="mt-2 text-white">กำลังโหลดข้อมูล...</p>
            </div>
          ) : queueItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white">ไม่มีคิวในระบบ</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white font-semibold">หมายเลขคิว</TableHead>
                    <TableHead className="text-white font-semibold">โค้ด</TableHead>
                    <TableHead className="text-white font-semibold">ชื่อผู้ใช้</TableHead>
                    <TableHead className="text-white font-semibold">รหัสผ่าน</TableHead>
                    <TableHead className="text-white font-semibold">ประเภท</TableHead>
                    <TableHead className="text-white font-semibold">เบอร์โทรศัพท์</TableHead>
                    <TableHead className="text-white font-semibold">สถานะ</TableHead>
                    <TableHead className="text-white font-semibold">วันที่</TableHead>
                    <TableHead className="text-white font-semibold">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queueItems.map((item) => {
                    const statusInfo = getStatusInfo(item.status);
                    const productInfo = getProductTypeInfo(item.product_type);
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="text-white">
                          <div className="text-xl font-bold text-blue-300">#{item.queue_number}</div>
                        </TableCell>
                        <TableCell className="text-white font-mono text-sm font-bold">
                          {(() => {
                            const contactInfo = item.contact_info || '';
                            const codeMatch = contactInfo.match(/Code: ([A-Z0-9]+)/);
                            return codeMatch ? codeMatch[1] : '-';
                          })()}
                        </TableCell>
                        <TableCell className="text-white">
                          {codesData[item.id]?.request?.roblox_username || item.customer_name || 'ไม่ระบุ'}
                        </TableCell>
                        <TableCell className="text-white font-mono text-xs">
                          {(() => {
                            const contactInfo = item.contact_info || '';
                            const passwordMatch = contactInfo.match(/Password: ([^|]+)/);
                            return passwordMatch ? passwordMatch[1].trim() : '-';
                          })()}
                        </TableCell>
                        <TableCell className="text-white">
                          {(() => {
                            const contactInfo = item.contact_info || '';
                            // ตรวจสอบว่าเป็น Robux หรือ Chicken จาก contact_info
                            if (contactInfo.includes('Robux') || contactInfo.includes('robux')) {
                              const robuxMatch = contactInfo.match(/(\d+)\s*Robux/);
                              return robuxMatch ? `${robuxMatch[1]} Robux` : 'Robux';
                            } else {
                              return 'ไก่ตัน';
                            }
                          })()}
                        </TableCell>
                        <TableCell className="text-white text-sm font-semibold">
                          {(() => {
                            const contactInfo = item.contact_info || '';
                            const phoneMatch = contactInfo.match(/Phone: ([^|]+)/);
                            const contactMatch = contactInfo.match(/Contact: ([^|]+)/);
                            
                            let contact = '-';
                            if (phoneMatch) {
                              contact = phoneMatch[1].trim();
                            } else if (contactMatch) {
                              contact = contactMatch[1].trim();
                            }
                            
                            return contact !== '-' ? (
                              <div className="flex items-center gap-2">
                                <span className="text-green-400">📱</span>
                                <span>{contact}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">ไม่มีข้อมูล</span>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="text-white">
                          <Badge className={`${statusInfo.color} text-white`}>
                            <div className="flex items-center gap-1">
                              {statusInfo.icon}
                              {statusInfo.text}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white text-xs">
                          {new Date(item.created_at).toLocaleDateString('th-TH')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => openUpdateDialog(item)}
                              className="h-8 px-2 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              แก้ไข
                            </Button>
                            {item.admin_notes && (
                              <Button
                                size="sm"
                                className="h-8 px-2 bg-green-600 hover:bg-green-700 text-white"
                                title={item.admin_notes}
                              >
                                <MessageSquare className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog สำหรับอัปเดตสถานะคิว */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">อัปเดตสถานะคิว #{selectedItem?.queue_number}</DialogTitle>
            <DialogDescription className="text-gray-300">
              เปลี่ยนสถานะและเพิ่มหมายเหตุสำหรับคิวนี้
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="status" className="text-white">สถานะ</Label>
              <Select value={updateStatus} onValueChange={(value: 'processing' | 'completed' | 'cancelled') => setUpdateStatus(value)}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="processing" className="text-white hover:bg-gray-700">กำลังดำเนินการ</SelectItem>
                  <SelectItem value="completed" className="text-white hover:bg-gray-700">เสร็จสิ้น</SelectItem>
                  <SelectItem value="cancelled" className="text-white hover:bg-gray-700">ยกเลิก</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="notes" className="text-white">หมายเหตุ (ไม่บังคับ)</Label>
              <Textarea
                id="notes"
                placeholder="เช่น: ติดต่อไม่ได้, ลูกค้ายกเลิก, มีปัญหาในการดำเนินการ..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowUpdateDialog(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white border-gray-500"
            >
              ยกเลิก
            </Button>
            <Button 
              onClick={handleUpdateStatus} 
              disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUpdating ? 'กำลังอัปเดต...' : 'อัปเดต'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
