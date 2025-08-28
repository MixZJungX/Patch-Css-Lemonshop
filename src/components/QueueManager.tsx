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

export default function QueueManager() {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [updateStatus, setUpdateStatus] = useState<'processing' | 'completed' | 'cancelled'>('processing');
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const loadQueueItems = async () => {
    try {
      setLoading(true);
      const items = await getAllQueueItems();
      setQueueItems(items);
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
            <Button onClick={loadQueueItems} disabled={loading} variant="outline">
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
          <CardTitle>รายการคิวทั้งหมด</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">กำลังโหลดข้อมูล...</p>
            </div>
          ) : queueItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">ไม่มีคิวในระบบ</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>หมายเลขคิว</TableHead>
                    <TableHead>ลูกค้า</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>วันที่สร้าง</TableHead>
                    <TableHead>จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queueItems.map((item) => {
                    const statusInfo = getStatusInfo(item.status);
                    const productInfo = getProductTypeInfo(item.product_type);
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="text-xl font-bold">#{item.queue_number}</div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.customer_name || 'ไม่ระบุ'}</div>
                            <div className="text-sm text-gray-500">{item.contact_info}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{productInfo.icon}</span>
                            <span>{productInfo.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusInfo.color} text-white`}>
                            <div className="flex items-center gap-1">
                              {statusInfo.icon}
                              {statusInfo.text}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(item.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => openUpdateDialog(item)}
                              variant="outline"
                              className="h-8 px-2"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              แก้ไข
                            </Button>
                            {item.admin_notes && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2"
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>อัปเดตสถานะคิว #{selectedItem?.queue_number}</DialogTitle>
            <DialogDescription>
              เปลี่ยนสถานะและเพิ่มหมายเหตุสำหรับคิวนี้
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">สถานะ</Label>
              <Select value={updateStatus} onValueChange={(value: 'processing' | 'completed' | 'cancelled') => setUpdateStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="processing">กำลังดำเนินการ</SelectItem>
                  <SelectItem value="completed">เสร็จสิ้น</SelectItem>
                  <SelectItem value="cancelled">ยกเลิก</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="notes">หมายเหตุ (ไม่บังคับ)</Label>
              <Textarea
                id="notes"
                placeholder="เช่น: ติดต่อไม่ได้, ลูกค้ายกเลิก, มีปัญหาในการดำเนินการ..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleUpdateStatus} disabled={isUpdating}>
              {isUpdating ? 'กำลังอัปเดต...' : 'อัปเดต'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
