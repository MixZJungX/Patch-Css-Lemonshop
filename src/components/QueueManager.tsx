import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { QueueItem } from '@/types';
import { getAllQueueItems, updateQueueStatus, deleteQueueItem } from '@/lib/queueApi';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Play, CheckCircle, XCircle, Clock, RefreshCw, Edit, MessageSquare, Trash2, Search, X, AlertCircle, CheckSquare, Square, Settings } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

export default function QueueManager() {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<QueueItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'waiting' | 'processing' | 'completed' | 'cancelled' | 'problem' | 'customer_fixed'>('all');
  const [problemTypeFilter, setProblemTypeFilter] = useState<'all' | 'map_verification' | 'phone_verification' | 'email_verification' | 'wrong_password'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<QueueItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Bulk update states
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<string>('');
  const [bulkNotes, setBulkNotes] = useState<string>('');
  const [bulkUpdating, setBulkUpdating] = useState(false);
  
  // Edit problem type states
  const [editProblemDialogOpen, setEditProblemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<QueueItem | null>(null);
  const [newProblemType, setNewProblemType] = useState<string>('');

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
      case 'problem': return { icon: <AlertCircle className="w-4 h-4" />, color: 'bg-orange-500', text: 'มีปัญหา' };
      case 'customer_fixed': return { icon: <CheckCircle className="w-4 h-4" />, color: 'bg-emerald-500', text: 'ลูกค้าแก้ไขแล้ว' };
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

  const waitingCount = queueItems.filter(item => item.status === 'waiting').length;
  const processingCount = queueItems.filter(item => item.status === 'processing').length;
  const completedCount = queueItems.filter(item => item.status === 'completed').length;
  const cancelledCount = queueItems.filter(item => item.status === 'cancelled').length;
  const problemCount = queueItems.filter(item => item.status === 'problem').length;
  const customerFixedCount = queueItems.filter((item: any) => item.status === 'customer_fixed').length;
  
  // นับจำนวนปัญหาตามประเภท
  const mapVerificationCount = queueItems.filter(item => 
    item.status === 'problem' && item.admin_notes?.includes('ติดยืนยันแมพ')
  ).length;
  const phoneVerificationCount = queueItems.filter(item => 
    item.status === 'problem' && item.admin_notes?.includes('ติดยืนยันโทรศัพท์')
  ).length;
  const emailVerificationCount = queueItems.filter(item => 
    item.status === 'problem' && item.admin_notes?.includes('ติดยืนยันเมล')
  ).length;
  const wrongPasswordCount = queueItems.filter(item => 
    item.status === 'problem' && item.admin_notes?.includes('ชื่อหรือรหัสผิด')
  ).length;

  // Filter items based on active filter, problem type filter and search term
  useEffect(() => {
    let filtered = queueItems;
    
    // Apply status filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(item => item.status === activeFilter);
    }
    
    // Apply problem type filter (only when status is 'problem')
    if (activeFilter === 'problem' && problemTypeFilter !== 'all') {
      filtered = filtered.filter(item => {
        if (item.status !== 'problem' || !item.admin_notes) return false;
        
        switch (problemTypeFilter) {
          case 'map_verification': return item.admin_notes.includes('ติดยืนยันแมพ');
          case 'phone_verification': return item.admin_notes.includes('ติดยืนยันโทรศัพท์');
          case 'email_verification': return item.admin_notes.includes('ติดยืนยันเมล');
          case 'wrong_password': return item.admin_notes.includes('ชื่อหรือรหัสผิด');
          default: return true;
        }
      });
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(item => {
        // ค้นหาจากหมายเลขคิว
        if (item.queue_number.toString().includes(searchLower)) return true;
        
        // ค้นหาจากชื่อในเกม (roblox_username)
        if (item.roblox_username && item.roblox_username.toLowerCase().includes(searchLower)) return true;
        
        // ค้นหาจากชื่อลูกค้า
        if (item.customer_name && item.customer_name.toLowerCase().includes(searchLower)) return true;
        
        // ค้นหาจากเบอร์โทรใน contact_info
        const phoneMatch = item.contact_info.match(/เบอร์โทร:\s*([^|]+)/)?.[1]?.trim() || 
                          item.contact_info.match(/Phone:\s*([^|]+)/)?.[1]?.trim() ||
                          item.contact_info.match(/(\d{10,})/)?.[1];
        if (phoneMatch && phoneMatch.includes(searchLower)) return true;
        
        // ค้นหาจากชื่อในเกมใน contact_info
        const nameMatch = item.contact_info.match(/ชื่อ:\s*([^|]+)/)?.[1]?.trim() ||
                         item.contact_info.match(/Username:\s*([^|]+)/)?.[1]?.trim();
        if (nameMatch && nameMatch.toLowerCase().includes(searchLower)) return true;
        
        // ค้นหาจากโค้ด
        if (item.assigned_code && item.assigned_code.toLowerCase().includes(searchLower)) return true;
        if (item.assigned_account_code && item.assigned_account_code.toLowerCase().includes(searchLower)) return true;
        
        // ค้นหาจากรหัสผ่าน
        if (item.roblox_password && item.roblox_password.toLowerCase().includes(searchLower)) return true;
        
        // ค้นหาจาก contact_info ทั้งหมด (fallback)
        if (item.contact_info.toLowerCase().includes(searchLower)) return true;
        
        // ค้นหาจากสถานะ
        if (item.status.toLowerCase().includes(searchLower)) return true;
        
        return false;
      });
    }
    
    setFilteredItems(filtered);
  }, [queueItems, activeFilter, problemTypeFilter, searchTerm]);

  const handleEditItem = (item: QueueItem) => {
    setSelectedItem(item);
    setNewStatus(item.status);
    setAdminNotes(item.admin_notes || '');
    setEditDialogOpen(true);
  };

  const handleEditProblemType = (item: QueueItem) => {
    setEditingItem(item);
    
    // ตรวจสอบประเภทปัญหาปัจจุบัน
    const currentProblemType = getCurrentProblemType(item.admin_notes || '');
    setNewProblemType(currentProblemType);
    
    setEditProblemDialogOpen(true);
  };

  const getCurrentProblemType = (adminNotes: string) => {
    if (adminNotes.includes('ติดยืนยันแมพ')) return 'map_verification';
    if (adminNotes.includes('ติดยืนยันโทรศัพท์')) return 'phone_verification';
    if (adminNotes.includes('ติดยืนยันเมล')) return 'email_verification';
    if (adminNotes.includes('ชื่อหรือรหัสผิด')) return 'wrong_password';
    return '';
  };

  const getProblemDescription = (problemType: string) => {
    switch (problemType) {
      case 'map_verification': return 'ติดยืนยันแมพ';
      case 'phone_verification': return 'ติดยืนยันโทรศัพท์';
      case 'email_verification': return 'ติดยืนยันเมล';
      case 'wrong_password': return 'ชื่อหรือรหัสผิด';
      default: return 'ปัญหาอื่นๆ';
    }
  };

  const handleUpdateProblemType = async () => {
    if (!editingItem || !newProblemType) return;

    setUpdating(true);
    try {
      const problemDescription = getProblemDescription(newProblemType);
      const newAdminNotes = `🚨 ประเภทปัญหา: ${problemDescription}`;
      
      await updateQueueStatus(editingItem.id, 'problem' as any, newAdminNotes);
      
      toast.success(`แก้ไขประเภทปัญหาเป็น: ${problemDescription}`);
      setEditProblemDialogOpen(false);
      setEditingItem(null);
      loadQueueItems();
    } catch (error) {
      console.error('Error updating problem type:', error);
      toast.error('เกิดข้อผิดพลาดในการแก้ไขประเภทปัญหา');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedItem || !newStatus) return;

    // ถ้าเลือกสถานะ "มีปัญหา" ให้เปิด Dialog เลือกประเภทปัญหา
    if (newStatus === 'problem') {
      setEditDialogOpen(false); // ปิด dialog แก้ไขสถานะปัจจุบัน
      setEditingItem(selectedItem); // เก็บข้อมูลไว้
      setNewProblemType(''); // รีเซ็ตการเลือกปัญหา
      setEditProblemDialogOpen(true); // เปิด dialog เลือกประเภทปัญหา
      return;
    }

    setUpdating(true);
    try {
      // อัปเดตสถานะคิว
      await updateQueueStatus(selectedItem.id, newStatus as any, adminNotes);
      
      // Sync กับตาราง redemption_requests
      if (selectedItem.redemption_request_id) {
        // แปลงสถานะคิวเป็นสถานะคำขอ
        let requestStatus = 'pending';
        switch (newStatus) {
          case 'completed':
            requestStatus = 'completed';
            break;
          case 'cancelled':
            requestStatus = 'rejected';
            break;
          case 'processing':
            requestStatus = 'processing';
            break;
          case 'problem':
            requestStatus = 'pending'; // ยังคงเป็น pending แต่มีปัญหา
            break;
          default:
            requestStatus = 'pending';
        }
        
        // อัปเดตสถานะในตาราง redemption_requests
        const { error: requestError } = await supabase
          .from('app_284beb8f90_redemption_requests')
          .update({ 
            status: requestStatus,
            admin_notes: adminNotes,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedItem.redemption_request_id);
          
        if (requestError) {
          console.error('❌ ไม่สามารถอัปเดตคำขอได้:', requestError);
          // ไม่แสดง error ให้ user เพราะคิวอัปเดตสำเร็จแล้ว
        } else {
          console.log('✅ อัปเดตคำขอสำเร็จ');
        }
      }
      
      toast.success(`อัปเดตสถานะคิว #${selectedItem.queue_number} สำเร็จ`);
      setEditDialogOpen(false);
      loadQueueItems(); // รีเฟรชข้อมูล
    } catch (error) {
      console.error('Error updating queue item:', error);
      toast.error('ไม่สามารถอัปเดตสถานะได้');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditDialogOpen(false);
    setSelectedItem(null);
    setNewStatus('');
    setAdminNotes('');
  };

  const handleDeleteQueue = (item: QueueItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    setDeleting(true);
    try {
      await deleteQueueItem(itemToDelete.id);
      toast.success(`ลบคิว #${itemToDelete.queue_number} สำเร็จ`);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      loadQueueItems(); // รีเฟรชข้อมูล
    } catch (error) {
      console.error('Error deleting queue item:', error);
      toast.error('ไม่สามารถลบคิวได้');
    } finally {
      setDeleting(false);
    }
  };

  // Bulk update functions
  const handleSelectItem = (itemId: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedItems.size === 0 || !bulkStatus) return;

    setBulkUpdating(true);
    try {
      const selectedItemsArray = Array.from(selectedItems);
      let successCount = 0;
      let errorCount = 0;

      // อัปเดตทีละรายการ
      for (const itemId of selectedItemsArray) {
        try {
          await updateQueueStatus(itemId, bulkStatus as any, bulkNotes);
          successCount++;
        } catch (error) {
          console.error(`Error updating item ${itemId}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`อัปเดตสถานะ ${successCount} รายการสำเร็จ`);
      }
      if (errorCount > 0) {
        toast.error(`อัปเดตสถานะ ${errorCount} รายการล้มเหลว`);
      }

      setBulkUpdateDialogOpen(false);
      setSelectedItems(new Set());
      setBulkStatus('');
      setBulkNotes('');
      loadQueueItems();
    } catch (error) {
      console.error('Error in bulk update:', error);
      toast.error('เกิดข้อผิดพลาดในการอัปเดตจำนวนมาก');
    } finally {
      setBulkUpdating(false);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold text-white flex items-center gap-3">
                🎯 จัดการระบบคิว
                <span className="text-sm font-normal text-purple-200 bg-purple-500/20 px-3 py-1 rounded-full">
                  {queueItems.length} รายการ
                </span>
              </CardTitle>
              <p className="text-purple-200 mt-2">จัดการคิวและสถานะการดำเนินการ</p>
            </div>
            <Button 
              onClick={loadQueueItems} 
              disabled={loading} 
              variant="outline" 
              className="text-white border-purple-400/50 hover:bg-purple-500/20 hover:border-purple-400 transition-all duration-200"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm border border-yellow-400/40 rounded-xl p-6 text-center shadow-lg hover:shadow-yellow-500/20 transition-all duration-300">
              <div className="text-3xl font-bold text-yellow-200 mb-2">{waitingCount}</div>
              <div className="text-sm text-yellow-100 font-medium">รอการดำเนินการ</div>
              <div className="text-xs text-yellow-200/70 mt-1">⏳ กำลังรอ</div>
            </div>
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-blue-400/40 rounded-xl p-6 text-center shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
              <div className="text-3xl font-bold text-blue-200 mb-2">{processingCount}</div>
              <div className="text-sm text-blue-100 font-medium">กำลังดำเนินการ</div>
              <div className="text-xs text-blue-200/70 mt-1">⚡ กำลังทำ</div>
            </div>
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/40 rounded-xl p-6 text-center shadow-lg hover:shadow-green-500/20 transition-all duration-300">
              <div className="text-3xl font-bold text-green-200 mb-2">{completedCount}</div>
              <div className="text-sm text-green-100 font-medium">เสร็จสิ้น</div>
              <div className="text-xs text-green-200/70 mt-1">✅ เรียบร้อย</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-400/40 rounded-xl p-6 text-center shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
              <div className="text-3xl font-bold text-purple-200 mb-2">{queueItems.length}</div>
              <div className="text-sm text-purple-100 font-medium">ทั้งหมด</div>
              <div className="text-xs text-purple-200/70 mt-1">📊 สรุป</div>
            </div>
            <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 backdrop-blur-sm border border-red-400/40 rounded-xl p-6 text-center shadow-lg hover:shadow-red-500/20 transition-all duration-300">
              <div className="text-3xl font-bold text-red-200 mb-2">{cancelledCount}</div>
              <div className="text-sm text-red-100 font-medium">ยกเลิก</div>
              <div className="text-xs text-red-200/70 mt-1">❌ ยกเลิกแล้ว</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter Section */}
      <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-gray-700/50">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="🔍 ค้นหาคิว... (หมายเลขคิว, ชื่อในเกม, เบอร์โทร, รหัสผ่าน, โค้ด)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
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
            
            {/* Search Tips */}
            <div className="text-sm text-gray-400 bg-gray-800/30 rounded-lg p-3 border border-gray-700/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-400">💡</span>
                <span className="font-medium text-yellow-300">วิธีค้นหาคิว:</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-blue-400">🎫</span>
                  <span>หมายเลขคิว: <code className="bg-gray-700/50 px-1 rounded">#123</code></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">👤</span>
                  <span>ชื่อในเกม: <code className="bg-gray-700/50 px-1 rounded">PlayerName</code></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-400">📱</span>
                  <span>เบอร์โทร: <code className="bg-gray-700/50 px-1 rounded">0821695505</code></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-orange-400">🎫</span>
                  <span>โค้ด: <code className="bg-gray-700/50 px-1 rounded">50BXJK258J</code></span>
                </div>
              </div>
            </div>
            
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2 justify-center">
            <Button
              onClick={() => setActiveFilter('all')}
              variant={activeFilter === 'all' ? 'default' : 'outline'}
              className={`${
                activeFilter === 'all'
                  ? 'bg-purple-500 hover:bg-purple-600 text-white'
                  : 'text-white border-purple-400/50 hover:bg-purple-500/20'
              } transition-all duration-200`}
            >
              📊 ทั้งหมด ({queueItems.length})
            </Button>
            <Button
              onClick={() => setActiveFilter('waiting')}
              variant={activeFilter === 'waiting' ? 'default' : 'outline'}
              className={`${
                activeFilter === 'waiting'
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  : 'text-white border-yellow-400/50 hover:bg-yellow-500/20'
              } transition-all duration-200`}
            >
              ⏳ รอดำเนินการ ({waitingCount})
            </Button>
            <Button
              onClick={() => setActiveFilter('processing')}
              variant={activeFilter === 'processing' ? 'default' : 'outline'}
              className={`${
                activeFilter === 'processing'
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'text-white border-blue-400/50 hover:bg-blue-500/20'
              } transition-all duration-200`}
            >
              ⚡ กำลังดำเนินการ ({processingCount})
            </Button>
            <Button
              onClick={() => setActiveFilter('completed')}
              variant={activeFilter === 'completed' ? 'default' : 'outline'}
              className={`${
                activeFilter === 'completed'
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'text-white border-green-400/50 hover:bg-green-500/20'
              } transition-all duration-200`}
            >
              ✅ สำเร็จแล้ว ({completedCount})
            </Button>
            <Button
              onClick={() => setActiveFilter('cancelled')}
              variant={activeFilter === 'cancelled' ? 'default' : 'outline'}
              className={`${
                activeFilter === 'cancelled'
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'text-white border-red-400/50 hover:bg-red-500/20'
              } transition-all duration-200`}
            >
              ❌ ยกเลิก ({cancelledCount})
            </Button>
            <Button
              onClick={() => setActiveFilter('problem')}
              variant={activeFilter === 'problem' ? 'default' : 'outline'}
              className={`${
                activeFilter === 'problem'
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'text-white border-orange-400/50 hover:bg-orange-500/20'
              } transition-all duration-200`}
            >
              ⚠️ มีปัญหา ({problemCount})
            </Button>
            <Button
              onClick={() => setActiveFilter('customer_fixed')}
              variant={activeFilter === 'customer_fixed' ? 'default' : 'outline'}
              className={`${
                activeFilter === 'customer_fixed'
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'text-white border-emerald-400/50 hover:bg-emerald-500/20'
              } transition-all duration-200`}
            >
              ✅ ลูกค้าแก้ไขแล้ว ({customerFixedCount})
            </Button>
            </div>
          </div>
          
          {/* Problem Type Filter - แสดงเฉพาะเมื่อเลือก filter 'problem' */}
          {activeFilter === 'problem' && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-white font-medium">🔍 กรองตามประเภทปัญหา:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setProblemTypeFilter('all')}
                  variant={problemTypeFilter === 'all' ? 'default' : 'outline'}
                  className={`${
                    problemTypeFilter === 'all'
                      ? 'bg-purple-500 hover:bg-purple-600 text-white'
                      : 'text-white border-purple-400/50 hover:bg-purple-500/20'
                  } transition-all duration-200 text-xs px-3 py-1`}
                >
                  ทั้งหมด ({problemCount})
                </Button>
                <Button
                  onClick={() => setProblemTypeFilter('map_verification')}
                  variant={problemTypeFilter === 'map_verification' ? 'default' : 'outline'}
                  className={`${
                    problemTypeFilter === 'map_verification'
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : 'text-white border-blue-400/50 hover:bg-blue-500/20'
                  } transition-all duration-200 text-xs px-3 py-1`}
                >
                  🗺️ ติดยืนยันแมพ ({mapVerificationCount})
                </Button>
                <Button
                  onClick={() => setProblemTypeFilter('phone_verification')}
                  variant={problemTypeFilter === 'phone_verification' ? 'default' : 'outline'}
                  className={`${
                    problemTypeFilter === 'phone_verification'
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'text-white border-green-400/50 hover:bg-green-500/20'
                  } transition-all duration-200 text-xs px-3 py-1`}
                >
                  📱 ติดยืนยันโทรศัพท์ ({phoneVerificationCount})
                </Button>
                <Button
                  onClick={() => setProblemTypeFilter('email_verification')}
                  variant={problemTypeFilter === 'email_verification' ? 'default' : 'outline'}
                  className={`${
                    problemTypeFilter === 'email_verification'
                      ? 'bg-purple-500 hover:bg-purple-600 text-white'
                      : 'text-white border-purple-400/50 hover:bg-purple-500/20'
                  } transition-all duration-200 text-xs px-3 py-1`}
                >
                  📧 ติดยืนยันเมล ({emailVerificationCount})
                </Button>
                <Button
                  onClick={() => setProblemTypeFilter('wrong_password')}
                  variant={problemTypeFilter === 'wrong_password' ? 'default' : 'outline'}
                  className={`${
                    problemTypeFilter === 'wrong_password'
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'text-white border-red-400/50 hover:bg-red-500/20'
                  } transition-all duration-200 text-xs px-3 py-1`}
                >
                  🔒 ชื่อหรือรหัสผิด ({wrongPasswordCount})
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Queue Table Card */}
      <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-gray-700/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-xl font-semibold flex items-center gap-2">
              📋 รายการคิวทั้งหมด
              <span className="text-sm font-normal text-gray-400 bg-gray-700/50 px-2 py-1 rounded-md">
                {filteredItems.length} รายการ
              </span>
              {searchTerm && (
                <span className="text-sm font-normal text-blue-400 bg-blue-500/20 px-2 py-1 rounded-md">
                  🔍 พบ {filteredItems.length} รายการสำหรับ "{searchTerm}"
                </span>
              )}
              {selectedItems.size > 0 && (
                <span className="text-sm font-normal text-green-400 bg-green-500/20 px-2 py-1 rounded-md">
                  ✅ เลือกแล้ว {selectedItems.size} รายการ
                </span>
              )}
            </CardTitle>
            
            {/* Bulk Update Section */}
            {filteredItems.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                    onCheckedChange={handleSelectAll}
                    className="border-purple-400 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                  />
                  <span className="text-sm text-purple-200">
                    เลือกทั้งหมด
                  </span>
                </div>
                
                {selectedItems.size > 0 && (
                  <Dialog open={bulkUpdateDialogOpen} onOpenChange={setBulkUpdateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-green-500/30"
                      >
                        <CheckSquare className="w-4 h-4 mr-2" />
                        อัปเดต {selectedItems.size} รายการ
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-400 border-t-transparent mx-auto"></div>
              <p className="mt-4 text-white text-lg">กำลังโหลดข้อมูล...</p>
              <p className="text-gray-400 text-sm">กรุณารอสักครู่</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-white text-lg font-medium">
                {searchTerm ? (
                  <>
                    ไม่พบคิวที่ตรงกับ "{searchTerm}"
                  </>
                ) : (
                  activeFilter === 'all' ? 'ไม่มีคิวในระบบ' : `ไม่มีคิวที่${activeFilter === 'waiting' ? 'รอดำเนินการ' : activeFilter === 'processing' ? 'กำลังดำเนินการ' : activeFilter === 'completed' ? 'เสร็จสิ้น' : activeFilter === 'cancelled' ? 'ยกเลิก' : 'มีปัญหา'}`
                )}
              </p>
              <p className="text-gray-400 text-sm">
                {searchTerm ? (
                  <>
                    ลองค้นหาด้วย: หมายเลขคิว, ชื่อในเกม, เบอร์โทร, หรือโค้ด
                    <br />
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="text-blue-400 hover:text-blue-300 underline mt-2"
                    >
                      ล้างการค้นหา
                    </button>
                  </>
                ) : (
                  activeFilter === 'all' ? 'ยังไม่มีลูกค้าเข้ามาในคิว' : 'ลองเปลี่ยน filter หรือรอสักครู่'
                )}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-700/50">
              <Table className="[&_td]:py-4 [&_th]:py-4">
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-gray-700/50">
                    <TableHead className="text-white font-semibold text-center w-12">☑️</TableHead>
                    <TableHead className="text-white font-semibold text-center">🎫 หมายเลขคิว</TableHead>
                    <TableHead className="text-white font-semibold">👤 ข้อมูลลูกค้า</TableHead>
                    <TableHead className="text-white font-semibold text-center">📦 ประเภท</TableHead>
                    <TableHead className="text-white font-semibold text-center">🏷️ สถานะ</TableHead>
                    <TableHead className="text-white font-semibold text-center">🚨 ประเภทปัญหา</TableHead>
                    <TableHead className="text-white font-semibold text-center">📅 วันที่สร้าง</TableHead>
                    <TableHead className="text-white font-semibold text-center">⚙️ การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const statusInfo = getStatusInfo(item.status);
                    const productInfo = getProductTypeInfo(item.product_type);
                    
                    return (
                      <TableRow key={item.id} className="hover:bg-gray-800/50 transition-colors duration-200 border-gray-700/30">
                        <TableCell className="text-center">
                          <Checkbox
                            checked={selectedItems.has(item.id)}
                            onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                            className="border-purple-400 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg p-3 border border-purple-400/30">
                            <div className="text-xl font-bold text-white">#{item.queue_number}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <div className="font-semibold text-white text-lg">
                                คิว #{item.queue_number}
                              </div>
                            </div>
                            
                            {/* แสดงข้อมูลติดต่อ */}
                            <div className="text-sm text-gray-300 bg-gray-800/50 rounded-md p-2">
                              📱 {item.contact_info}
                            </div>
                            
                            {/* แสดงข้อมูลเพิ่มเติม */}
                            <div className="space-y-1">
                              {(item.roblox_username || item.customer_name) && (
                                <div className="text-xs text-blue-300 bg-blue-500/10 rounded px-2 py-1 inline-block">
                                  👤 {item.roblox_username || item.customer_name}
                                </div>
                              )}
                              {item.roblox_password && (
                                <div className="text-xs text-yellow-300 bg-yellow-500/10 rounded px-2 py-1 inline-block">
                                  🔒 {item.roblox_password}
                                </div>
                              )}
                              {item.robux_amount && (
                                <div className="text-xs text-green-300 bg-green-500/10 rounded px-2 py-1 inline-block">
                                  💎 {item.robux_amount} Robux
                                </div>
                              )}
                              {item.assigned_code && (
                                <div className="text-xs text-purple-300 bg-purple-500/10 rounded px-2 py-1 inline-block">
                                  🎫 Code: {item.assigned_code}
                                </div>
                              )}
                              {!item.assigned_code && item.roblox_username && (
                                <div className="text-xs text-red-300 bg-red-500/10 rounded px-2 py-1 inline-block">
                                  ⚠️ ไม่พบโค้ด
                                </div>
                              )}
                              {item.assigned_account_code && (
                                <div className="text-xs text-orange-300 bg-orange-500/10 rounded px-2 py-1 inline-block">
                                  🔑 Account: {item.assigned_account_code}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded-lg p-3 border border-gray-600/30">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-2xl">{productInfo.icon}</span>
                              <span className="text-white text-sm font-medium">{productInfo.name}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={`${statusInfo.color} text-white px-4 py-2 rounded-full shadow-lg`}>
                            <div className="flex items-center gap-2">
                              {statusInfo.icon}
                              <span className="font-medium">{statusInfo.text}</span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {item.status === 'problem' && item.admin_notes ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="text-xs px-3 py-2 rounded-lg text-orange-300 bg-orange-900/30 border border-orange-500/30">
                                {item.admin_notes.includes('ติดยืนยันแมพ') && '🗺️ ติดยืนยันแมพ'}
                                {item.admin_notes.includes('ติดยืนยันโทรศัพท์') && '📱 ติดยืนยันโทรศัพท์'}
                                {item.admin_notes.includes('ติดยืนยันเมล') && '📧 ติดยืนยันเมล'}
                                {item.admin_notes.includes('ชื่อหรือรหัสผิด') && '🔒 ชื่อหรือรหัสผิด'}
                                {!item.admin_notes.includes('ติดยืนยันแมพ') && 
                                 !item.admin_notes.includes('ติดยืนยันโทรศัพท์') && 
                                 !item.admin_notes.includes('ติดยืนยันเมล') && 
                                 !item.admin_notes.includes('ชื่อหรือรหัสผิด') && 
                                 '❓ ปัญหาอื่นๆ'}
                              </div>
                              <Button
                                onClick={() => handleEditProblemType(item)}
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0 border-orange-400 text-orange-400 hover:bg-orange-500 hover:text-white"
                                title="แก้ไขประเภทปัญหา"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/30">
                            <div className="text-sm text-white font-medium">
                              {formatDate(item.created_at)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleEditItem(item)}
                                size="sm"
                                variant="outline"
                                className="text-white border-purple-400/50 hover:bg-purple-500/20 hover:border-purple-400 transition-all duration-200 px-3"
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                แก้ไข
                              </Button>
                              <Button
                                onClick={() => handleDeleteQueue(item)}
                                size="sm"
                                variant="outline"
                                className="text-white border-red-400/50 hover:bg-red-500/20 hover:border-red-400 transition-all duration-200 px-3"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                ลบ
                              </Button>
                            </div>
                            {item.admin_notes && (
                              <div className="flex items-center gap-1 text-yellow-300 text-xs bg-yellow-500/10 rounded px-2 py-1">
                                <MessageSquare className="w-3 h-3" />
                                <span>มีหมายเหตุ</span>
                              </div>
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

      {/* Dialog แก้ไขสถานะและหมายเหตุ */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-gradient-to-br from-gray-900 to-gray-800 text-white border border-purple-500/30 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold flex items-center gap-3">
              ✏️ แก้ไขสถานะคิว #{selectedItem?.queue_number}
              <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 px-3 py-1 rounded-full text-sm font-normal">
                👤 {selectedItem?.roblox_username || selectedItem?.customer_name || 'ไม่ระบุ'}
              </div>
            </DialogTitle>
            <DialogDescription className="text-gray-300 text-base">
              อัปเดตสถานะและหมายเหตุสำหรับลูกค้า
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-white">สถานะ</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="bg-white/10 border-white/30 text-white">
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-white/30">
                  <SelectItem value="waiting" className="text-white hover:bg-gray-700">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      รอคิว
                    </div>
                  </SelectItem>
                  <SelectItem value="processing" className="text-white hover:bg-gray-700">
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      กำลังดำเนินการ
                    </div>
                  </SelectItem>
                  <SelectItem value="completed" className="text-white hover:bg-gray-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      เสร็จสิ้น
                    </div>
                  </SelectItem>
                  <SelectItem value="cancelled" className="text-white hover:bg-gray-700">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      ยกเลิก
                    </div>
                  </SelectItem>
                  <SelectItem value="problem" className="text-white hover:bg-gray-700">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      มีปัญหา
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white">หมายเหตุ (สำหรับลูกค้า)</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="ใส่หมายเหตุอธิบายเหตุผลที่คิวถูกข้ามหรือยกเลิก..."
                className="bg-white/10 border-white/30 text-white placeholder:text-gray-400 min-h-[100px]"
              />
              <p className="text-sm text-gray-400 mt-1">
                หมายเหตุนี้จะแสดงให้ลูกค้าเห็นเมื่อเช็คสถานะคิว
              </p>
            </div>

            {selectedItem && (
              <div className="bg-white/5 rounded-lg p-3">
                <h4 className="font-semibold text-white mb-2">ข้อมูลลูกค้า:</h4>
                <div className="text-sm text-gray-300 space-y-1">
                  <p><strong>ชื่อ:</strong> {selectedItem.roblox_username || selectedItem.customer_name || 'ไม่ระบุ'}</p>
                  <p><strong>ติดต่อ:</strong> {selectedItem.contact_info}</p>
                  <p><strong>ประเภท:</strong> {getProductTypeInfo(selectedItem.product_type).name}</p>
                  {selectedItem.roblox_username && (
                    <p><strong>Roblox Username:</strong> {selectedItem.roblox_username}</p>
                  )}
                  {selectedItem.roblox_password && (
                    <p><strong>รหัสผ่าน:</strong> {selectedItem.roblox_password}</p>
                  )}
                  
                  {/* แสดงข้อมูลที่ลูกค้าส่งมาใหม่ (ถ้ามี) */}
                  {selectedItem.customer_updated_credentials && (
                    <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <h5 className="font-semibold text-blue-300 mb-2 flex items-center gap-2">
                        <span>📝</span>
                        ข้อมูลใหม่ที่ลูกค้าส่งมา:
                      </h5>
                      <div className="space-y-2 text-blue-200">
                        {selectedItem.customer_updated_credentials.username && (
                          <p><strong>ชื่อผู้ใช้ใหม่:</strong> {selectedItem.customer_updated_credentials.username}</p>
                        )}
                        {selectedItem.customer_updated_credentials.password && (
                          <p><strong>รหัสผ่านใหม่:</strong> {selectedItem.customer_updated_credentials.password}</p>
                        )}
                        {(selectedItem.customer_updated_credentials as any)?.game_history_image && (
                          <div className="space-y-2">
                            <p className="font-semibold text-blue-300">🖼️ รูปภาพประวัติการเล่น:</p>
                            <img
                              src={(selectedItem.customer_updated_credentials as any).game_history_image}
                              alt="Game History"
                              className="w-full max-h-96 object-contain rounded-lg border-2 border-blue-400/50 cursor-pointer hover:border-blue-400"
                              onClick={() => window.open((selectedItem.customer_updated_credentials as any)?.game_history_image, '_blank')}
                              title="คลิกเพื่อดูรูปเต็มขนาด"
                            />
                            <p className="text-xs text-blue-300/70">💡 คลิกที่รูปเพื่อดูขนาดเต็ม</p>
                          </div>
                        )}
                        {selectedItem.customer_updated_credentials.old_username && (
                          <p className="text-xs opacity-70"><strong>ชื่อเดิม:</strong> {selectedItem.customer_updated_credentials.old_username}</p>
                        )}
                        <p className="text-xs opacity-70">
                          <strong>ส่งมาเมื่อ:</strong> {new Date(selectedItem.customer_updated_credentials.uploaded_at).toLocaleString('th-TH')}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* แยกข้อมูลจาก contact_info */}
                  {selectedItem.contact_info && (
                    <>
                      {selectedItem.contact_info.includes('เบอร์โทร:') && (
                        <p><strong>เบอร์โทร:</strong> {selectedItem.contact_info.match(/เบอร์โทร:\s*([^|]+)/)?.[1]?.trim() || 'ไม่ระบุ'}</p>
                      )}
                      {selectedItem.contact_info.includes('Password:') && (
                        <p><strong>รหัสผ่าน:</strong> {selectedItem.contact_info.match(/Password:\s*([^|]+)/)?.[1]?.trim() || 'ไม่ระบุ'}</p>
                      )}
                      {selectedItem.contact_info.includes('Code:') && (
                        <p><strong>โค้ด:</strong> {selectedItem.contact_info.match(/Code:\s*([^|]+)/)?.[1]?.trim() || 'ไม่ระบุ'}</p>
                      )}
                    </>
                  )}
                  {selectedItem.robux_amount && (
                    <p><strong>จำนวน Robux:</strong> {selectedItem.robux_amount}</p>
                  )}
                  {selectedItem.assigned_code && (
                    <p><strong>โค้ด:</strong> {selectedItem.assigned_code}</p>
                  )}
                  {selectedItem.assigned_account_code && (
                    <p><strong>Account Code:</strong> {selectedItem.assigned_account_code}</p>
                  )}
                  <p><strong>วันที่สร้าง:</strong> {formatDate(selectedItem.created_at)}</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={handleCancelEdit}
              variant="outline"
              className="text-white border-white/30 hover:bg-white/10"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={updating || !newStatus}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {updating ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  กำลังอัปเดต...
                </div>
              ) : (
                'อัปเดตสถานะ'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-gray-900 border-red-500/30">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              ยืนยันการลบคิว
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              คุณแน่ใจหรือไม่ที่จะลบคิว #{itemToDelete?.queue_number} ของ {itemToDelete?.roblox_username || itemToDelete?.customer_name || 'ไม่ระบุ'}?
              <br />
              <span className="text-red-400 font-semibold">การกระทำนี้ไม่สามารถย้อนกลับได้!</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              onClick={cancelDelete}
              variant="outline"
              className="border-gray-500 text-gray-300 hover:bg-gray-700"
              disabled={deleting}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  กำลังลบ...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  ลบคิว
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Update Dialog */}
      <Dialog open={bulkUpdateDialogOpen} onOpenChange={setBulkUpdateDialogOpen}>
        <DialogContent className="bg-gray-900 border-green-500/30 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-green-400 flex items-center gap-2">
              <CheckSquare className="w-5 h-5" />
              อัปเดตสถานะจำนวนมาก
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              คุณกำลังจะอัปเดตสถานะของ <span className="text-green-400 font-semibold">{selectedItems.size} รายการ</span>
              <br />
              กรุณาเลือกสถานะใหม่และหมายเหตุ (ถ้ามี)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulk-status" className="text-white font-medium">สถานะใหม่</Label>
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="เลือกสถานะ..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="waiting" className="text-yellow-400 hover:bg-gray-700">
                    ⏳ รอดำเนินการ
                  </SelectItem>
                  <SelectItem value="processing" className="text-blue-400 hover:bg-gray-700">
                    ⚡ กำลังดำเนินการ
                  </SelectItem>
                  <SelectItem value="completed" className="text-green-400 hover:bg-gray-700">
                    ✅ เสร็จสิ้น
                  </SelectItem>
                  <SelectItem value="cancelled" className="text-red-400 hover:bg-gray-700">
                    ❌ ยกเลิก
                  </SelectItem>
                  <SelectItem value="problem" className="text-orange-400 hover:bg-gray-700">
                    ⚠️ มีปัญหา
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="bulk-notes" className="text-white font-medium">หมายเหตุ (ไม่บังคับ)</Label>
              <Textarea
                id="bulk-notes"
                placeholder="หมายเหตุสำหรับการอัปเดต..."
                value={bulkNotes}
                onChange={(e) => setBulkNotes(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 min-h-[80px]"
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              onClick={() => setBulkUpdateDialogOpen(false)}
              variant="outline"
              className="border-gray-500 text-gray-300 hover:bg-gray-700"
              disabled={bulkUpdating}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleBulkUpdate}
              disabled={bulkUpdating || !bulkStatus}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {bulkUpdating ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  กำลังอัปเดต...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4" />
                  อัปเดต {selectedItems.size} รายการ
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Problem Type Dialog */}
      <Dialog open={editProblemDialogOpen} onOpenChange={setEditProblemDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-gradient-to-br from-gray-900 to-gray-800 border border-orange-500/30">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-semibold flex items-center gap-2">
              <Edit className="w-5 h-5 text-orange-400" />
              แก้ไขประเภทปัญหา
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              กรุณาเลือกประเภทปัญหาที่ถูกต้องสำหรับคิว #{editingItem?.queue_number}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            <Button
              onClick={() => setNewProblemType('map_verification')}
              variant="outline"
              className={`w-full px-5 py-4 h-auto text-left justify-start border-2 transition-all ${
                newProblemType === 'map_verification' 
                  ? 'border-blue-500 bg-blue-500/10 text-white' 
                  : 'border-gray-700 hover:border-blue-400 text-gray-300 hover:bg-blue-500/20 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🗺️</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-base mb-1">ติดยืนยันแมพ</div>
                  <div className="text-xs opacity-70 leading-relaxed">ปัญหาการยืนยันตัวตนผ่านแมพในเกม</div>
                </div>
              </div>
            </Button>

            <Button
              onClick={() => setNewProblemType('phone_verification')}
              variant="outline"
              className={`w-full px-5 py-4 h-auto text-left justify-start border-2 transition-all ${
                newProblemType === 'phone_verification' 
                  ? 'border-green-500 bg-green-500/10 text-white' 
                  : 'border-gray-700 hover:border-green-400 text-gray-300 hover:bg-green-500/20 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📱</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-base mb-1">ติดยืนยันโทรศัพท์</div>
                  <div className="text-xs opacity-70 leading-relaxed">ปัญหาการยืนยันหมายเลขโทรศัพท์</div>
                </div>
              </div>
            </Button>

            <Button
              onClick={() => setNewProblemType('email_verification')}
              variant="outline"
              className={`w-full px-5 py-4 h-auto text-left justify-start border-2 transition-all ${
                newProblemType === 'email_verification' 
                  ? 'border-purple-500 bg-purple-500/10 text-white' 
                  : 'border-gray-700 hover:border-purple-400 text-gray-300 hover:bg-purple-500/20 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📧</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-base mb-1">ติดยืนยันเมล</div>
                  <div className="text-xs opacity-70 leading-relaxed">ปัญหาการยืนยันอีเมล</div>
                </div>
              </div>
            </Button>

            <Button
              onClick={() => setNewProblemType('wrong_password')}
              variant="outline"
              className={`w-full px-5 py-4 h-auto text-left justify-start border-2 transition-all ${
                newProblemType === 'wrong_password' 
                  ? 'border-red-500 bg-red-500/10 text-white' 
                  : 'border-gray-700 hover:border-red-400 text-gray-300 hover:bg-red-500/20 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🔒</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-base mb-1">ชื่อหรือรหัสผิด</div>
                  <div className="text-xs opacity-70 leading-relaxed">ปัญหาการใส่รหัสผ่านไม่ถูกต้อง</div>
                </div>
              </div>
            </Button>
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              onClick={() => setEditProblemDialogOpen(false)}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
              disabled={updating}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleUpdateProblemType}
              disabled={updating || !newProblemType}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {updating ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  กำลังบันทึก...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  บันทึกการเปลี่ยนแปลง
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
