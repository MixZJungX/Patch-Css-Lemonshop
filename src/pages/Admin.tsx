import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { adminApi } from '@/lib/adminApi';
import { useAuth } from '@/contexts/AuthContext';
import { RedemptionRequest, RedemptionCode, ChickenAccount } from '@/types';
import { Link } from 'react-router-dom';
import { Upload, Search } from 'lucide-react';
import QueueManager from '@/components/QueueManager';

export default function Admin() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'requests' | 'codes' | 'accounts' | 'rainbow' | 'add-rainbow' | 'announcements' | 'queue'>('requests');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRequestFilter, setActiveRequestFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'rejected'>('all');
  const [requests, setRequests] = useState<RedemptionRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<RedemptionRequest[]>([]);
  const [codes, setCodes] = useState<RedemptionCode[]>([]);
  const [accounts, setAccounts] = useState<ChickenAccount[]>([]);
  const [rainbowRequests, setRainbowRequests] = useState<{
    id: string;
    ubisoftEmail: string;
    ubisoftPassword: string;
    hasXboxAccount: boolean;
    xboxEmail: string;
    xboxPassword: string;
    redeemCode: string;
    contact: string;
    phoneNumber: string;
    status: string;
    credits: number;
    created_at: string;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Array<{ id: string; title?: string; content: string; type?: 'info' | 'warning' | 'critical'; link?: string; is_active?: boolean; created_at?: string }>>([]);
  const [newAnnouncement, setNewAnnouncement] = useState<{ title: string; content: string; type: 'info' | 'warning' | 'critical'; link: string; is_active: boolean }>({ title: '', content: '', type: 'info', link: '', is_active: true });

  // Form states
  const [newCode, setNewCode] = useState({ code: '', robux_value: '' });
  const [newRainbowCode, setNewRainbowCode] = useState({ code: '', credits: '' });
  const [bulkRainbowCodes, setBulkRainbowCodes] = useState('');
  const [showBulkRainbowModal, setShowBulkRainbowModal] = useState(false);
  const [isAddingRainbowCode, setIsAddingRainbowCode] = useState(false);
  const [bulkPreview, setBulkPreview] = useState<{ valid: any[], invalid: string[] }>({ valid: [], invalid: [] });
  const [newAccount, setNewAccount] = useState({
    code: '',
    username: '',
    password: '',
    description: '',
    notes: ''
  });
  const [customProductName, setCustomProductName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [bulkImportData, setBulkImportData] = useState('');
  const [bulkImportType, setBulkImportType] = useState<'codes' | 'accounts'>('codes');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showBulkImportDialog, setShowBulkImportDialog] = useState(false);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Real-time validation for bulk Rainbow Six codes
  useEffect(() => {
    if (!bulkRainbowCodes.trim()) {
      setBulkPreview({ valid: [], invalid: [] });
      return;
    }

    const lines = bulkRainbowCodes.split('\n').filter(line => line.trim());
    const validCodes = [];
    const invalidLines = [];

    for (const line of lines) {
      const parts = line.trim().split(',');
      if (parts.length !== 2) {
        invalidLines.push(line);
        continue;
      }

      const [code, creditsStr] = parts.map(part => part.trim());
      const credits = parseInt(creditsStr);

      if (!code || isNaN(credits) || credits <= 0) {
        invalidLines.push(line);
        continue;
      }

      validCodes.push({
        code: code.toUpperCase(),
        credits,
        originalLine: line
      });
    }

    setBulkPreview({ valid: validCodes, invalid: invalidLines });
  }, [bulkRainbowCodes]);

  const processBulkImport = async () => {
    if (!bulkImportData.trim()) {
      toast.error('กรุณากรอกข้อมูลที่ต้องการนำเข้า');
      return;
    }

    setIsProcessingBulk(true);
    
    try {
      const lines = bulkImportData.trim().split('\n');
      let successCount = 0;
      let errorCount = 0;

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        if (bulkImportType === 'codes') {
          // Process Robux codes: code,robux_value
          const [code, robuxValue] = trimmedLine.split(',').map(s => s.trim());
          
          if (!code || !robuxValue) {
            errorCount++;
            continue;
          }

          const { error } = await supabase
            .from('app_284beb8f90_redemption_codes')
            .insert([{
              code: code.toUpperCase(),
              robux_value: parseInt(robuxValue),
              status: 'available',
              created_at: new Date().toISOString()
            }]);

          if (error) {
            errorCount++;
            console.error('Error importing code:', code, error);
          } else {
            successCount++;
          }
        } else {
          // Process chicken accounts: code,type,username,password,notes
          const parts = trimmedLine.split(',').map(s => s.trim());
          const [code, productType, username, password, notes = ''] = parts;
          
          if (!code || !productType || !username || !password) {
            errorCount++;
            continue;
          }

          const { error } = await adminApi.createChickenAccounts([{
            code: code.toUpperCase(),
            product_type: productType,
            username: username,
            password: password,
            notes: notes,
            status: 'available',
            created_at: new Date().toISOString()
          }]);

          if (error) {
            errorCount++;
            console.error('Error importing account:', code, error);
          } else {
            successCount++;
          }
        }
      }

      if (successCount > 0) {
        toast.success(`นำเข้าข้อมูลสำเร็จ ${successCount} รายการ${errorCount > 0 ? `, ไม่สำเร็จ ${errorCount} รายการ` : ''}`);
        setBulkImportData('');
        setShowBulkImportDialog(false);
        loadData(); // Reload data
      } else {
        toast.error(`ไม่สามารถนำเข้าข้อมูลได้ (${errorCount} รายการล้มเหลว)`);
      }
    } catch (error) {
      console.error('Bulk import error:', error);
      toast.error('เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
    } finally {
      setIsProcessingBulk(false);
    }
  };
  
  // Filter requests based on activeRequestFilter
  useEffect(() => {
    if (activeRequestFilter === 'all') {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(requests.filter(request => request.status === activeRequestFilter));
    }
  }, [requests, activeRequestFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Try to load from Supabase first
      try {
        const [requestsRes, codesRes, accountsRes, rainbowCodesRes] = await Promise.all([
          supabase.from('app_284beb8f90_redemption_requests').select('*').order('created_at', { ascending: false }),
          supabase.from('app_284beb8f90_redemption_codes').select('*').order('created_at', { ascending: false }),
          supabase.from('app_284beb8f90_chicken_accounts').select('*').order('created_at', { ascending: false }),
          supabase.from('app_284beb8f90_rainbow_codes').select('*').order('created_at', { ascending: false })
        ]);

        setRequests(requestsRes.data || []);
        setAccounts(accountsRes.data || []);

        // Combine Robux codes and Rainbow Six codes
        let allCodes = [...(codesRes.data || [])];
        
        // Transform Rainbow Six codes to match the codes structure
        if (rainbowCodesRes.data && !rainbowCodesRes.error) {
          const transformedRainbowCodes = rainbowCodesRes.data.map(code => ({
            ...code,
            product_name: 'Rainbow Six Credits',
            robux_value: code.credits, // Map credits to robux_value for consistency
            status: code.is_used ? 'used' : 'available'
          }));
          allCodes = [...allCodes, ...transformedRainbowCodes];
          console.log('✅ Loaded Rainbow Six codes from Supabase:', transformedRainbowCodes.length, 'codes');
        }

        setCodes(allCodes);

        // Load announcements (active and inactive)
        try {
          const { data: annData } = await supabase
            .from('app_284beb8f90_announcements')
            .select('*')
            .order('created_at', { ascending: false });
          setAnnouncements((annData || []).map((a: any) => ({ id: a.id, title: a.title, content: a.content || a.message, type: a.type || 'info', link: a.link || '', is_active: a.is_active, created_at: a.created_at })));
        } catch (_e) {
          setAnnouncements([]);
        }

        // Load Rainbow Six requests - ONLY from Supabase
        try {
          const { data: rainbowData, error: rainbowError } = await supabase
            .from('app_284beb8f90_rainbow_requests')
            .select('*')
            .order('created_at', { ascending: false });

          if (rainbowError) {
            console.error('Error loading Rainbow Six requests:', rainbowError);
            setRainbowRequests([]);
            throw rainbowError;
          }

          // Transform data to match expected format
          const transformedRequests = (rainbowData || []).map(req => ({
            id: req.id,
            ubisoftEmail: req.user_email,
            ubisoftPassword: req.ubisoft_password || 'ไม่มีข้อมูล',
            hasXboxAccount: req.has_xbox_account,
            xboxEmail: req.xbox_email || '',
            xboxPassword: req.xbox_password || 'ไม่มีข้อมูล',
            redeemCode: req.assigned_code,
            contact: req.user_name,
            phoneNumber: req.user_phone || 'ไม่มีข้อมูล',
            status: req.status,
            credits: req.credits_requested || 1200,
            created_at: req.created_at
          }));
          setRainbowRequests(transformedRequests);
          console.log('✅ Loaded Rainbow Six requests from Supabase:', transformedRequests.length, 'requests');
        } catch (error) {
          console.error('Error loading Rainbow Six requests:', error);
          setRainbowRequests([]);
        }
      } catch (supabaseError) {
        // Fallback to localStorage for all data
        console.log('Supabase connection failed, using localStorage fallback');
        const localRequests = JSON.parse(localStorage.getItem('redemption_requests') || '[]');
        const localCodes = JSON.parse(localStorage.getItem('redemption_codes') || '[]');
        const localAccounts = JSON.parse(localStorage.getItem('chicken_accounts') || '[]');
        const localRainbowRequests = JSON.parse(localStorage.getItem('rainbow_requests') || '[]');
        
        setRequests(localRequests);
        setCodes(localCodes);
        setAccounts(localAccounts);
        setRainbowRequests(localRainbowRequests);
        setAnnouncements([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const addAnnouncement = async () => {
    if (!newAnnouncement.content.trim()) {
      toast.error('กรุณากรอกข้อความประกาศ');
      return;
    }
    try {
      const payload = {
        id: crypto.randomUUID(),
        title: newAnnouncement.title || null,
        content: newAnnouncement.content,
        type: newAnnouncement.type,
        link: newAnnouncement.link || null,
        is_active: newAnnouncement.is_active,
        created_at: new Date().toISOString(),
      };
      const { data, error } = await adminApi.createAnnouncement(payload);
      if (error) throw new Error(error);
      toast.success('เพิ่มประกาศสำเร็จ');
      setNewAnnouncement({ title: '', content: '', type: 'info', link: '', is_active: true });
      await loadData();
    } catch (e) {
      console.error(e);
      toast.error('ไม่สามารถเพิ่มประกาศได้');
    }
  };

  const toggleAnnouncementActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await adminApi.updateAnnouncement(id, { is_active: isActive, updated_at: new Date().toISOString() });
      if (error) throw new Error(error);
      toast.success('อัพเดทสถานะประกาศสำเร็จ');
      await loadData();
    } catch (e) {
      toast.error('อัพเดทสถานะไม่สำเร็จ');
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm('ลบประกาศนี้หรือไม่?')) return;
    try {
      const { error } = await adminApi.deleteAnnouncement(id);
      if (error) throw new Error(error);
      toast.success('ลบประกาศสำเร็จ');
      await loadData();
    } catch (e) {
      toast.error('ไม่สามารถลบประกาศได้');
    }
  };

  const updateRequestStatus = async (id: string, status: string, adminNotes?: string) => {
    try {
      // Check if this is a Rainbow Six request by finding it in the requests array
      const request = requests.find(req => req.id === id);
      // Since RedemptionRequest doesn't have 'type' property, we'll use a different approach
      const tableName = 'app_284beb8f90_redemption_requests';

      const { error } = await supabase
        .from(tableName)
        .update({ status, admin_notes: adminNotes, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      // ถ้าสถานะเป็น 'rejected' หรือ 'cancelled' ให้อัปเดตคิวด้วย
      if (status === 'rejected' || status === 'cancelled') {
        try {
          // หาคิวที่เกี่ยวข้องกับคำขอนี้
          const { data: queueItems } = await supabase
            .from('queue_items')
            .select('*')
            .eq('redemption_request_id', id);

          if (queueItems && queueItems.length > 0) {
            // อัปเดตสถานะคิวเป็น 'cancelled'
            await supabase
              .from('queue_items')
              .update({ 
                status: 'cancelled',
                admin_notes: adminNotes || `คำขอถูก${status === 'rejected' ? 'ปฏิเสธ' : 'ยกเลิก'} โดยแอดมิน`
              })
              .eq('redemption_request_id', id);
          }
        } catch (queueError) {
          console.warn('ไม่สามารถอัปเดตคิวได้:', queueError);
        }
      }

      toast.success('อัพเดทสถานะสำเร็จ');
      loadData();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการอัพเดท');
    }
  };

  const deleteRequest = async (id: string) => {
    console.log('🚀 deleteRequest called with ID:', id);
    console.log('📊 Current requests count:', requests.length);
    console.log('📊 Current rainbowRequests count:', rainbowRequests.length);
    
    // ตรวจสอบสิทธิ์ของผู้ใช้
    if (!user) {
      console.error('❌ User not authenticated');
      toast.error('กรุณาเข้าสู่ระบบก่อน');
      return;
    }
    
    if (!confirm('คุณแน่ใจหรือไม่ที่ต้องการลบคำขอนี้? การดำเนินการนี้ไม่สามารถยกเลิกได้')) {
      console.log('❌ User cancelled deletion');
      return;
    }

    try {
      console.log('🗑️ Attempting to delete request, ID:', id);
      
      // Check if this is a Rainbow Six request by finding it in both arrays
      const rainbowRequest = rainbowRequests.find(req => req.id === id);
      const regularRequest = requests.find(req => req.id === id);
      
      let tableName = 'app_284beb8f90_redemption_requests'; // default
      let requestType = 'regular';
      
      if (rainbowRequest) {
        tableName = 'app_284beb8f90_rainbow_requests';
        requestType = 'rainbow';
        console.log('🗑️ Found Rainbow Six request, using table:', tableName);
      } else if (regularRequest) {
        console.log('🗑️ Found regular request, using table:', tableName);
      } else {
        console.log('⚠️ Request not found in either array, trying both tables');
      }

      // ลองลบจากตารางแรก
      let { data, error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)
        .select();

      if (error) {
        console.error('❌ Delete failed from table:', tableName, error);
        
        // ตรวจสอบว่าเป็นปัญหา RLS หรือไม่
        if (error.message.includes('permission') || error.message.includes('policy')) {
          console.log('🔒 RLS policy issue detected, trying alternative approach...');
          
          // ลองใช้ adminApi แทน
          try {
            console.log('🔄 Trying adminApi delete...');
            const result = await adminApi.deleteRequest(id, requestType);
            if (result.error) {
              throw new Error(result.error);
            }
            console.log('✅ Successfully deleted via adminApi');
          } catch (adminError) {
            console.error('❌ AdminApi delete failed:', adminError);
            
            // ลองตารางที่สองถ้าทุกอย่างไม่สำเร็จ
            const otherTable = tableName === 'app_284beb8f90_rainbow_requests' 
              ? 'app_284beb8f90_redemption_requests' 
              : 'app_284beb8f90_rainbow_requests';
            
            console.log('🔄 Trying alternative table:', otherTable);
            
            const { data: secondData, error: secondError } = await supabase
              .from(otherTable)
              .delete()
              .eq('id', id)
              .select();
              
            if (secondError) {
              console.error('❌ Delete failed from both tables:', secondError);
              throw new Error(`ไม่สามารถลบข้อมูลได้: ${secondError.message}`);
            }
            
            // ตรวจสอบว่าข้อมูลถูกลบจริงหรือไม่
            if (!secondData || secondData.length === 0) {
              console.error('❌ No rows were deleted from alternative table');
              throw new Error('ไม่พบข้อมูลที่ต้องการลบ');
            }
            
            console.log('✅ Successfully deleted from alternative table:', otherTable, 'Rows deleted:', secondData.length);
          }
        } else {
          // ลองตารางที่สองถ้าตารางแรกไม่สำเร็จ
          const otherTable = tableName === 'app_284beb8f90_rainbow_requests' 
            ? 'app_284beb8f90_redemption_requests' 
            : 'app_284beb8f90_rainbow_requests';
          
          console.log('🔄 Trying alternative table:', otherTable);
          
          const { data: secondData, error: secondError } = await supabase
            .from(otherTable)
            .delete()
            .eq('id', id)
            .select();
            
          if (secondError) {
            console.error('❌ Delete failed from both tables:', secondError);
            throw new Error(`ไม่สามารถลบข้อมูลได้: ${secondError.message}`);
          }
          
          // ตรวจสอบว่าข้อมูลถูกลบจริงหรือไม่
          if (!secondData || secondData.length === 0) {
            console.error('❌ No rows were deleted from alternative table');
            throw new Error('ไม่พบข้อมูลที่ต้องการลบ');
          }
          
          console.log('✅ Successfully deleted from alternative table:', otherTable, 'Rows deleted:', secondData.length);
        }
      } else {
        // ตรวจสอบว่าข้อมูลถูกลบจริงหรือไม่
        if (!data || data.length === 0) {
          console.error('❌ No rows were deleted from table:', tableName);
          throw new Error('ไม่พบข้อมูลที่ต้องการลบ');
        }
        
        console.log('✅ Successfully deleted from table:', tableName, 'Rows deleted:', data.length);
      }
      
      // ยืนยันว่าการลบสำเร็จแล้วค่อยอัพเดท UI
      console.log('✅ Database deletion successful, updating UI...');
      
      // ตรวจสอบว่าข้อมูลถูกลบจริงหรือไม่โดยการ query ใหม่
      const { data: checkData, error: checkError } = await supabase
        .from(tableName)
        .select('id')
        .eq('id', id)
        .single();
      
      if (checkData) {
        console.error('❌ Data still exists after deletion!');
        throw new Error('ข้อมูลยังคงอยู่ในฐานข้อมูล');
      }
      
      console.log('✅ Confirmed: Data successfully deleted from database');
      
      // Force immediate UI update by filtering out the deleted item
      setRequests(prevRequests => prevRequests.filter(req => req.id !== id));
      setRainbowRequests(prevRequests => prevRequests.filter(req => req.id !== id));
      
      console.log('✅ UI updated, request removed from display');
      toast.success('ลบคำขอสำเร็จ');
      
      // Reload data to ensure consistency
      console.log('🔄 Reloading data to ensure consistency...');
      await loadData();
    } catch (error) {
      console.error('Delete error:', error);
      
      // แสดงข้อความ error ที่เฉพาะเจาะจงมากขึ้น
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          toast.error('ไม่มีสิทธิ์ในการลบคำขอ กรุณาติดต่อผู้ดูแลระบบ');
        } else if (error.message.includes('network')) {
          toast.error('เกิดปัญหาการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
        } else {
          toast.error(`เกิดข้อผิดพลาดในการลบคำขอ: ${error.message}`);
        }
      } else {
        toast.error('เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุในการลบคำขอ');
      }
    }
  };

  const updateRainbowRequestStatus = async (id: string, status: string) => {
    try {
      console.log('🔄 Updating Rainbow Six request:', id, 'to status:', status);
      
      // Try to update in Supabase first - use correct table name
      const { error } = await supabase
        .from('app_284beb8f90_rainbow_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('❌ Supabase update failed:', error);
        throw error;
      }
      
      console.log('✅ Successfully updated Rainbow Six request in Supabase');

      toast.success('อัพเดทสถานะ Rainbow Six สำเร็จ');
      
      // Force reload the data
      console.log('🔄 Reloading all data after status update...');
      await loadData();
    } catch (error) {
      console.error('❌ Error updating Rainbow Six status:', error);
      toast.error('เกิดข้อผิดพลาดในการอัพเดท');
    }
  };

  const deleteRainbowRequest = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบคำขอนี้?')) {
      return;
    }

    try {
      // Try to delete from Supabase first - use correct table name
      console.log('🗑️ Attempting to delete Rainbow Six request from database, ID:', id);
      
      const { data, error } = await supabase
        .from('app_284beb8f90_rainbow_requests')
        .delete()
        .eq('id', id)
        .select(); // Add select() to see what was actually deleted

      if (error) {
        // Fallback to localStorage
        const localRequests = JSON.parse(localStorage.getItem('rainbow_requests') || '[]');
        const filteredRequests = localRequests.filter((req: { id: string }) => req.id !== id);
        localStorage.setItem('rainbow_requests', JSON.stringify(filteredRequests));
      }

      console.log('🗑️ Delete result:', { error });

      if (error) {
        console.error('❌ Database delete failed:', error);
        toast.success('ลบคำขอ Rainbow Six สำเร็จ (บันทึกในเครื่อง)');
      } else {
        console.log('✅ Successfully deleted from database');
        toast.success('ลบคำขอ Rainbow Six สำเร็จ');
      }

      // Update UI immediately without calling loadData()
      setRainbowRequests(prevRequests => prevRequests.filter(req => req.id !== id));
      console.log('✅ UI updated, request removed from display');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการลบ');
    }
  };

  const handleAddRainbowCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newRainbowCode.code.trim() || !newRainbowCode.credits.trim()) {
      toast.error('กรุณากรอกข้อมูลให้ครบ');
      return;
    }

    const creditsValue = parseInt(newRainbowCode.credits);
    if (isNaN(creditsValue) || creditsValue <= 0) {
      toast.error('จำนวน Credits ต้องเป็นตัวเลขที่มากกว่า 0');
      return;
    }

    setIsAddingRainbowCode(true);
    try {
      const { data, error } = await supabase
        .from('app_284beb8f90_rainbow_codes')
        .insert({
          code: newRainbowCode.code.trim().toUpperCase(),
          credits: creditsValue,
          is_used: false,
          created_at: new Date().toISOString()
        })
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Successfully added Rainbow Six code:', data);
      toast.success('เพิ่มโค้ด Rainbow Six สำเร็จ');
      setNewRainbowCode({ code: '', credits: '' });
      await loadData(); // Wait for data to reload
      
      // Show success message and scroll to codes list
      setTimeout(() => {
        const codesSection = document.getElementById('rainbow-six-codes-list');
        if (codesSection) {
          codesSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    } catch (error) {
      console.error('Rainbow Six code addition error:', error);
      // Fallback to localStorage if Supabase fails
      try {
        const existingCodes = JSON.parse(localStorage.getItem('redemption_codes') || '[]');
        const newCode = {
          id: Date.now().toString(),
          code: newRainbowCode.code.trim().toUpperCase(),
          robux_value: creditsValue,
          product_name: 'Rainbow Six Credits',
          status: 'available',
          created_at: new Date().toISOString()
        };
        existingCodes.push(newCode);
        localStorage.setItem('redemption_codes', JSON.stringify(existingCodes));
        toast.success('เพิ่มโค้ด Rainbow Six สำเร็จ (บันทึกในเครื่อง)');
        setNewRainbowCode({ code: '', credits: '' });
        await loadData();
        
        // Auto-scroll to Rainbow Six codes list
        setTimeout(() => {
          const element = document.getElementById('rainbow-six-codes-list');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } catch (localError) {
        toast.error(`เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : 'ไม่ทราบสาเหตุ'}`);
      }
    } finally {
      setIsAddingRainbowCode(false);
    }
  };

  const handleBulkAddRainbowCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bulkRainbowCodes.trim()) {
      toast.error('กรุณากรอกข้อมูลโค้ด');
      return;
    }

    setIsAddingRainbowCode(true);
    try {
      const lines = bulkRainbowCodes.split('\n').filter(line => line.trim());
      const codesToAdd = [];
      const failedLines = [];

      for (const line of lines) {
        const parts = line.trim().split(',');
        if (parts.length !== 2) {
          failedLines.push(line);
          continue;
        }

        const [code, creditsStr] = parts.map(part => part.trim());
        const credits = parseInt(creditsStr);

        if (!code || isNaN(credits) || credits <= 0) {
          failedLines.push(line);
          continue;
        }

        codesToAdd.push({
          code: code.toUpperCase(),
          credits,
          is_used: false,
          created_at: new Date().toISOString()
        });
      }

      if (codesToAdd.length === 0) {
        toast.error('ไม่พบข้อมูลที่ถูกต้อง กรุณาใช้รูปแบบ: โค้ด,เครดิต');
        return;
      }

      // Try to save to Supabase first
      const { data, error: supabaseError } = await supabase
        .from('app_284beb8f90_rainbow_codes')
        .insert(codesToAdd)
        .select();

      if (supabaseError) {
        console.error('Supabase bulk insert failed:', supabaseError);
        // Fallback to localStorage if Supabase fails
        const existingCodes = JSON.parse(localStorage.getItem('redemption_codes') || '[]');
        const newCodes = codesToAdd.map((codeData, index) => ({
          id: (Date.now() + index).toString(),
          code: codeData.code,
          robux_value: codeData.credits,
          product_name: 'Rainbow Six Credits',
          status: 'available',
          created_at: codeData.created_at
        }));
        
        existingCodes.push(...newCodes);
        localStorage.setItem('redemption_codes', JSON.stringify(existingCodes));
        console.log('⚠️ Supabase failed, saved to localStorage');
      }

      let successMessage = `เพิ่มโค้ด Rainbow Six สำเร็จ ${codesToAdd.length} โค้ด`;
      if (failedLines.length > 0) {
        successMessage += ` (มีข้อมูลผิดพลาด ${failedLines.length} บรรทัด)`;
      }
      
      toast.success(successMessage);
      setBulkRainbowCodes('');
      setShowBulkRainbowModal(false);
      await loadData();
      
      // Auto-scroll to Rainbow Six codes list
      setTimeout(() => {
        const element = document.getElementById('rainbow-six-codes-list');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (error) {
      console.error('Error bulk adding Rainbow Six codes:', error);
      toast.error('เกิดข้อผิดพลาดในการเพิ่มโค้ด');
    } finally {
      setIsAddingRainbowCode(false);
    }
  };

  const addCode = async () => {
    if (!newCode.code || !newCode.robux_value) {
      toast.error('กรุณากรอกข้อมูลให้ครบ');
      return;
    }

    try {
      const { data, error } = await adminApi.createRedemptionCode({
        id: crypto.randomUUID(),
        code: newCode.code,
        robux_value: parseInt(newCode.robux_value),
        robux_amount: parseInt(newCode.robux_value),
        status: 'available',
        created_at: new Date().toISOString()
      });

      if (error) throw new Error(error);
      toast.success('เพิ่มโค้ดสำเร็จ');
      setNewCode({ code: '', robux_value: '' });
      loadData();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการเพิ่มโค้ด');
    }
  };

  const addAccount = async () => {
    if (!newAccount.code || !newAccount.username || !newAccount.password || !newAccount.description) {
      toast.error('กรุณากรอกข้อมูลให้ครบ');
      return;
    }

    try {
      const accountData = {
        code: newAccount.code,
        username: newAccount.username,
        password: newAccount.password,
        product_type: newAccount.description, // Map description to product_type
        notes: newAccount.notes,
        status: 'available',
        created_at: new Date().toISOString()
      };
      const result = await adminApi.createChickenAccount(accountData);
      if (result.error) {
        throw new Error(result.error);
      }
      toast.success(`เพิ่มบัญชี ${newAccount.description} สำเร็จ`);
      setNewAccount({ code: '', username: '', password: '', description: '', notes: '' });
      setShowCustomInput(false);
      setCustomProductName('');
      loadData();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการเพิ่มบัญชี');
    }
  };

  const deleteItemFromTable = async (table: string, id: string) => {
    try {
      let result;
      
      // Use specific delete functions based on table
      if (table === 'app_284beb8f90_redemption_codes') {
        result = await adminApi.deleteRedemptionCode(id);
      } else if (table === 'app_284beb8f90_chicken_accounts') {
        result = await adminApi.deleteChickenAccount(id);
      } else if (table === 'app_284beb8f90_rainbow_codes') {
        result = await adminApi.deleteRainbowCode(id);
      } else {
        throw new Error('ไม่รู้จักตารางนี้');
      }
      
      if (result.error) throw new Error(result.error);
      toast.success('ลบสำเร็จ');
      loadData();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('เกิดข้อผิดพลาดในการลบ: ' + (error instanceof Error ? error.message : 'ไม่ทราบสาเหตุ'));
    }
  };

  const handleBulkImport = async () => {
    if (!bulkImportData.trim()) {
      toast.error('กรุณาใส่ข้อมูลที่ต้องการนำเข้า');
      return;
    }

    const lines = bulkImportData.trim().split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      toast.error('ไม่พบข้อมูลที่ถูกต้อง');
      return;
    }

    setIsProcessingBulk(true);
    try {
      if (bulkImportType === 'codes') {
        // Format: CODE,ROBUX_VALUE
        const codeData = lines.map(line => {
          const [code, robuxValue] = line.split(',').map(s => s.trim());
          if (!code || !robuxValue || isNaN(Number(robuxValue))) {
            throw new Error(`รูปแบบไม่ถูกต้อง: ${line}`);
          }
          return {
            code: code.toUpperCase(),
            robux_value: parseInt(robuxValue),
            robux_amount: parseInt(robuxValue),
            status: 'available',
            created_at: new Date().toISOString()
          };
        });

        const { error } = await adminApi.createRedemptionCodes(codeData);

        if (error) throw error;
        toast.success(`เพิ่มโค้ด Robux จำนวน ${codeData.length} รายการสำเร็จ!`);
      } else {
        // Format: CODE,PRODUCT_NAME,USERNAME,PASSWORD,NOTES
        const accountData = lines.map(line => {
          const parts = line.split(',').map(s => s.trim());
          if (parts.length < 4) {
            throw new Error(`รูปแบบไม่ถูกต้อง: ${line}`);
          }
          const [code, productName, username, password, notes = ''] = parts;
          return {
            code: code.toUpperCase(),
            product_type: productName,
            username,
            password,
            notes,
            status: 'available'
          };
        });

        const { error } = await adminApi.createChickenAccounts(accountData);

        if (error) throw error;
        toast.success(`เพิ่มบัญชีไก่ตัน จำนวน ${accountData.length} รายการสำเร็จ!`);
      }

      setBulkImportData('');
      setShowBulkImportDialog(false);
      loadData();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล';
      toast.error(errorMessage);
    } finally {
      setIsProcessingBulk(false);
    }
  };

  // ฟังก์ชันทดสอบปุ่มลบ
  const testDeleteButton = () => {
    console.log('🧪 Testing delete button functionality');
    console.log('👤 Current user:', user);
    console.log('📊 Requests available:', requests.length);
    console.log('📊 Rainbow requests available:', rainbowRequests.length);
    
    if (requests.length > 0) {
      const testId = requests[0].id;
      console.log('🧪 Testing with first request ID:', testId);
      console.log('🧪 Request details:', requests[0]);
      deleteRequest(testId);
    } else if (rainbowRequests.length > 0) {
      const testId = rainbowRequests[0].id;
      console.log('🧪 Testing with first rainbow request ID:', testId);
      console.log('🧪 Rainbow request details:', rainbowRequests[0]);
      deleteRequest(testId);
    } else {
      console.log('❌ No requests available for testing');
      toast.error('ไม่มีคำขอสำหรับทดสอบ');
    }
  };

  // ฟังก์ชันทดสอบการเชื่อมต่อฐานข้อมูล
  const testDatabaseConnection = async () => {
    console.log('🔍 Testing database connection...');
    
    try {
      // ทดสอบการอ่านข้อมูล
      const { data: testData, error: testError } = await supabase
        .from('app_284beb8f90_redemption_requests')
        .select('id')
        .limit(1);
      
      if (testError) {
        console.error('❌ Database read test failed:', testError);
        toast.error('ไม่สามารถเชื่อมต่อฐานข้อมูลได้');
      } else {
        console.log('✅ Database read test successful');
        toast.success('เชื่อมต่อฐานข้อมูลสำเร็จ');
      }
    } catch (error) {
      console.error('❌ Database connection test failed:', error);
      toast.error('เกิดข้อผิดพลาดในการทดสอบฐานข้อมูล');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white">🔐 เข้าสู่ระบบแอดมิน</CardTitle>
          </CardHeader>
          <CardContent>
            <Link to="/login">
              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600">
                เข้าสู่ระบบ
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl">👑</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">แผงควบคุมแอดมิน</h1>
                <p className="text-sm text-purple-200">จัดการระบบแลกโค้ด</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-white">👋 {user.email}</span>
              <Button 
                onClick={testDeleteButton} 
                variant="outline" 
                className="bg-yellow-500/20 border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/30"
              >
                🧪 ทดสอบปุ่มลบ
              </Button>
              <Button 
                onClick={testDatabaseConnection} 
                variant="outline" 
                className="bg-blue-500/20 border-blue-500/30 text-blue-300 hover:bg-blue-500/30"
              >
                🔍 ทดสอบฐานข้อมูล
              </Button>
              <Link to="/">
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  กลับหน้าหลัก
                </Button>
              </Link>
              <Button onClick={signOut} variant="outline" className="bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30">
                ออกจากระบบ
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 text-white">
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-1">📋</div>
              <div className="text-xl font-bold text-blue-300">{requests.length}</div>
              <div className="text-xs text-blue-200">คำขอทั้งหมด</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 text-white">
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-1">⏳</div>
              <div className="text-xl font-bold text-yellow-300">{requests.filter(r => r.status === 'pending').length}</div>
              <div className="text-xs text-yellow-200">รอดำเนินการ</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 text-white">
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-1">💎</div>
              <div className="text-xl font-bold text-purple-300">{codes.filter(c => c.status === 'active').length}</div>
              <div className="text-xs text-purple-200">โค้ดพร้อมใช้</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 text-white">
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-1">🐔</div>
              <div className="text-xl font-bold text-green-300">{accounts.filter(a => a.status === 'available').length}</div>
              <div className="text-xs text-green-200">บัญชีพร้อมใช้</div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-6">
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-1 border border-white/20">
            {[
              { key: 'requests', label: '📋 คำขอ', count: requests.filter(r => r.status === 'pending').length },
              { key: 'codes', label: '💎 โค้ด', count: codes.length },
              { key: 'accounts', label: '🐔 บัญชี', count: accounts.length },
              { key: 'rainbow', label: '🎮 Rainbow Six', count: rainbowRequests.length },
              { key: 'add-rainbow', label: '➕ เพิ่มโค้ด R6', count: 0 },
              { key: 'announcements', label: '📢 ประกาศ', count: announcements.filter(a => a.is_active).length },
              { key: 'queue', label: '🎯 ระบบคิว', count: 0 }
            ].map(tab => (
              <Button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as 'requests' | 'codes' | 'accounts' | 'rainbow' | 'add-rainbow' | 'announcements' | 'queue')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'bg-transparent text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.label} {tab.count > 0 && `(${tab.count})`}
              </Button>
            ))}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'requests' && (
          <Card className="bg-white/10 backdrop-blur-xl border-white/20">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle className="text-white">📋 จัดการคำขอ</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => setActiveRequestFilter('all')}
                    size="sm"
                    className={`px-3 py-1 ${
                      activeRequestFilter === 'all'
                        ? 'bg-white text-gray-900 shadow-lg'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    ทั้งหมด ({requests.length})
                  </Button>
                  <Button
                    onClick={() => setActiveRequestFilter('pending')}
                    size="sm"
                    className={`px-3 py-1 ${
                      activeRequestFilter === 'pending'
                        ? 'bg-yellow-400 text-yellow-900 shadow-lg'
                        : 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
                    }`}
                  >
                    รอดำเนินการ ({requests.filter(r => r.status === 'pending').length})
                  </Button>
                  <Button
                    onClick={() => setActiveRequestFilter('processing')}
                    size="sm"
                    className={`px-3 py-1 ${
                      activeRequestFilter === 'processing'
                        ? 'bg-blue-400 text-blue-900 shadow-lg'
                        : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                    }`}
                  >
                    กำลังดำเนินการ ({requests.filter(r => r.status === 'processing').length})
                  </Button>
                  <Button
                    onClick={() => setActiveRequestFilter('completed')}
                    size="sm"
                    className={`px-3 py-1 ${
                      activeRequestFilter === 'completed'
                        ? 'bg-green-400 text-green-900 shadow-lg'
                        : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                    }`}
                  >
                    สำเร็จแล้ว ({requests.filter(r => r.status === 'completed').length})
                  </Button>
                  <Button
                    onClick={() => setActiveRequestFilter('rejected')}
                    size="sm"
                    className={`px-3 py-1 ${
                      activeRequestFilter === 'rejected'
                        ? 'bg-red-400 text-red-900 shadow-lg'
                        : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                    }`}
                  >
                    ยกเลิก ({requests.filter(r => r.status === 'rejected').length})
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-white">โค้ด</TableHead>
                      <TableHead className="text-white">ชื่อผู้ใช้</TableHead>
                      <TableHead className="text-white">รหัสผ่าน</TableHead>
                      <TableHead className="text-white">ประเภท</TableHead>
                      <TableHead className="text-white">เบอร์โทรศัพท์</TableHead>
                      <TableHead className="text-white">สถานะ</TableHead>
                      <TableHead className="text-white">วันที่</TableHead>
                      <TableHead className="text-white">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.length === 0 ? (
                      <TableRow className="border-white/10">
                        <TableCell colSpan={8} className="text-center text-white py-8">
                          {loading ? 
                            "กำลังโหลดข้อมูล..." : 
                            activeRequestFilter === 'all' ? 
                              "ไม่พบคำขอในระบบ" : 
                              `ไม่พบคำขอในสถานะ "${
                                activeRequestFilter === 'pending' ? 'รอดำเนินการ' :
                                activeRequestFilter === 'processing' ? 'กำลังดำเนินการ' :
                                activeRequestFilter === 'completed' ? 'สำเร็จแล้ว' : 'ยกเลิก'
                              }"`
                          }
                        </TableCell>
                      </TableRow>
                    ) : filteredRequests.map(request => {
                      // Extract code from contact_info if it contains "Code:"
                      const codeMatch = request.contact_info.match(/Code: ([A-Z0-9]+)/);
                      const code = codeMatch ? codeMatch[1] : '-';
                      
                      // Extract password from contact_info if it contains "Password:"
                      const passwordMatch = request.contact_info.match(/Password: ([^|]+)/);
                      const password = passwordMatch ? passwordMatch[1].trim() : '-';
                      
                      // Extract contact (phone number) from contact_info - support both old and new format
                      let contact = '-';
                      const contactMatch = request.contact_info.match(/Contact: ([^|]+)/);
                      const phoneMatch = request.contact_info.match(/Phone: ([^|]+)/);
                      
                      if (phoneMatch) {
                        contact = phoneMatch[1].trim();
                      } else if (contactMatch) {
                        contact = contactMatch[1].trim();
                      }
                      
                      return (
                        <TableRow key={request.id} className="border-white/10">
                                                  <TableCell className="text-white font-mono text-sm font-bold">{code}</TableCell>
                        <TableCell className="text-white">{request.roblox_username}</TableCell>
                        <TableCell className="text-white font-mono text-xs">{password}</TableCell>
                        <TableCell className="text-white">
                          {request.robux_amount > 0 ? `${request.robux_amount} Robux` : 'ไก่ตัน'}
                        </TableCell>
                        <TableCell className="text-white text-sm font-semibold">
                          {contact !== '-' ? (
                            <div className="flex items-center gap-2">
                              <span className="text-green-400">📱</span>
                              <span>{contact}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">ไม่มีข้อมูล</span>
                          )}
                        </TableCell>
                          <TableCell>
                            <Badge className={
                              request.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                              request.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                              request.status === 'processing' ? 'bg-blue-500/20 text-blue-300' :
                              'bg-red-500/20 text-red-300'
                            }>
                              {request.status === 'pending' ? 'รอดำเนินการ' :
                               request.status === 'completed' ? 'เสร็จสิ้น' :
                               request.status === 'processing' ? 'กำลังดำเนินการ' : 'ยกเลิก'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-white text-xs">
                            {new Date(request.created_at).toLocaleDateString('th-TH')}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                onClick={() => updateRequestStatus(request.id, 'processing')}
                                className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-xs"
                                disabled={request.status === 'processing'}
                              >
                                ดำเนินการ
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => updateRequestStatus(request.id, 'completed')}
                                className="bg-green-500/20 text-green-300 hover:bg-green-500/30 text-xs"
                                disabled={request.status === 'completed'}
                              >
                                เสร็จสิ้น
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => updateRequestStatus(request.id, 'rejected')}
                                className="bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs"
                                disabled={request.status === 'rejected'}
                              >
                                ยกเลิก
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  // Show detailed info in a toast or alert
                                  const details = `
โค้ด: ${code}
ชื่อผู้ใช้: ${request.roblox_username}
รหัสผ่าน: ${password}
เบอร์โทรศัพท์: ${contact}
ประเภท: ${request.robux_amount > 0 ? `${request.robux_amount} Robux` : 'ไก่ตัน'}
สถานะ: ${request.status}
วันที่: ${new Date(request.created_at).toLocaleDateString('th-TH')}
                                  `.trim();
                                  alert(details);
                                }}
                                className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-xs"
                              >
                                📋 รายละเอียด
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  console.log('🔘 Delete button clicked for request ID:', request.id);
                                  deleteRequest(request.id);
                                }}
                                className="bg-gray-600/20 text-gray-300 hover:bg-gray-600/30 text-xs"
                              >
                                ลบ
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'codes' && (
          <div className="space-y-6">
            {/* Add New Code */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white">➕ เพิ่มโค้ด Robux ใหม่</CardTitle>
                  <Button
                    onClick={() => {
                      setBulkImportType('codes');
                      setShowBulkImportDialog(true);
                    }}
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    นำเข้าหลายรายการ
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    placeholder="รหัสโค้ด"
                    value={newCode.code}
                    onChange={(e) => setNewCode(prev => ({ ...prev, code: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                  <Input
                    type="number"
                    placeholder="จำนวน Robux"
                    value={newCode.robux_value}
                    onChange={(e) => setNewCode(prev => ({ ...prev, robux_value: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                  <Button onClick={addCode} className="bg-gradient-to-r from-purple-600 to-pink-600">
                    เพิ่มโค้ด
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Codes List */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <CardTitle className="text-white">💎 รายการโค้ด Robux</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead className="text-white">โค้ด</TableHead>
                        <TableHead className="text-white">Robux</TableHead>
                        <TableHead className="text-white">สถานะ</TableHead>
                        <TableHead className="text-white">วันที่สร้าง</TableHead>
                        <TableHead className="text-white">จัดการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {codes.map(code => (
                        <TableRow key={code.id} className="border-white/10">
                          <TableCell className="text-white font-mono">{code.code}</TableCell>
                          <TableCell className="text-white">{code.robux_value}</TableCell>
                          <TableCell>
                            <Badge className={code.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}>
                              {code.status === 'active' ? 'ใช้ได้' : 'ใช้แล้ว'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-white text-xs">
                            {new Date(code.created_at).toLocaleDateString('th-TH')}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => deleteItemFromTable('app_284beb8f90_redemption_codes', code.id)}
                              className="bg-red-500/20 text-red-300 hover:bg-red-500/30"
                            >
                              ลบ
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>


          </div>
        )}

        {activeTab === 'accounts' && (
          <div className="space-y-6">
            {/* Add New Account */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white">➕ เพิ่มบัญชีไก่ตันใหม่</CardTitle>
                  <Button
                    onClick={() => {
                      setBulkImportType('accounts');
                      setShowBulkImportDialog(true);
                    }}
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    นำเข้าหลายรายการ
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="รหัสบัญชี"
                    value={newAccount.code}
                    onChange={(e) => setNewAccount(prev => ({ ...prev, code: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                  <Input
                    placeholder="ชื่อผู้ใช้"
                    value={newAccount.username}
                    onChange={(e) => setNewAccount(prev => ({ ...prev, username: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                  <Input
                    placeholder="รหัสผ่าน"
                    value={newAccount.password}
                    onChange={(e) => setNewAccount(prev => ({ ...prev, password: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                  <div className="space-y-2">
                    <Select onValueChange={(value) => {
                      if (value === 'custom') {
                        setShowCustomInput(true);
                        setNewAccount(prev => ({ ...prev, description: '' }));
                      } else {
                        setShowCustomInput(false);
                        setNewAccount(prev => ({ ...prev, description: value }));
                      }
                    }}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="ประเภทบัญชี" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        {/* Existing types from database */}
                        {Array.from(new Set(accounts.map(acc => acc.product_name))).map(product => (
                          <SelectItem key={product} value={product}>{product}</SelectItem>
                        ))}
                        {/* Default types */}
                        <SelectItem value="Bone Blossom">Bone Blossom</SelectItem>
                        <SelectItem value="Butterfly">Butterfly</SelectItem>
                        <SelectItem value="Disco bee">Disco bee</SelectItem>
                        <SelectItem value="Dragonfly">Dragonfly</SelectItem>
                        <SelectItem value="Chicken zombie">Chicken zombie</SelectItem>
                        <SelectItem value="อื่นๆ">อื่นๆ</SelectItem>
                        <SelectItem value="custom">➕ เพิ่มประเภทใหม่</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {showCustomInput && (
                      <div className="space-y-2">
                        <Input
                          placeholder="ชื่อประเภทบัญชีใหม่"
                          value={customProductName}
                          onChange={(e) => setCustomProductName(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                        <div className="flex space-x-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              if (customProductName.trim()) {
                                setNewAccount(prev => ({ ...prev, description: customProductName.trim() }));
                                setShowCustomInput(false);
                                setCustomProductName('');
                              }
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            ✓ ใช้ประเภทนี้
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setShowCustomInput(false);
                              setCustomProductName('');
                            }}
                            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                          >
                            ยกเลิก
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  <Textarea
                    placeholder="หมายเหตุ"
                    value={newAccount.notes}
                    onChange={(e) => setNewAccount(prev => ({ ...prev, notes: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 md:col-span-2"
                  />
                  <Button onClick={addAccount} className="bg-gradient-to-r from-orange-600 to-yellow-600 md:col-span-2">
                    เพิ่มบัญชี
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Accounts List */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <CardTitle className="text-white">🐔 รายการบัญชีไก่ตัน</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Search Bar */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
                    <Input
                      placeholder="ค้นหาบัญชีไก่ตัน (รหัส, ชื่อผู้ใช้, รหัสผ่าน, ประเภท, หรือสถานะ)"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                  {searchTerm && (
                    <Button
                      onClick={() => setSearchTerm('')}
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      ล้างการค้นหา
                    </Button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead className="text-white">รหัส</TableHead>
                        <TableHead className="text-white">ชื่อผู้ใช้</TableHead>
                        <TableHead className="text-white">รหัสผ่าน</TableHead>
                        <TableHead className="text-white">ประเภท</TableHead>
                        <TableHead className="text-white">สถานะ</TableHead>
                        <TableHead className="text-white">จัดการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accounts.filter(account => {
                        if (!searchTerm) return true;
                        const searchLower = searchTerm.toLowerCase();
                        return (
                          account.code.toLowerCase().includes(searchLower) ||
                          account.username.toLowerCase().includes(searchLower) ||
                          account.password.toLowerCase().includes(searchLower) ||
                          (account.product_name && account.product_name.toLowerCase().includes(searchLower)) ||
                          account.status.toLowerCase().includes(searchLower)
                        );
                      }).map(account => (
                        <TableRow key={account.id} className="border-white/10">
                          <TableCell className="text-white font-mono text-xs">{account.code}</TableCell>
                          <TableCell className="text-white">{account.username}</TableCell>
                          <TableCell className="text-white font-mono text-xs">{account.password}</TableCell>
                          <TableCell className="text-white">{account.product_name || 'ไม่มีข้อมูล'}</TableCell>
                          <TableCell>
                            <Badge className={account.status === 'available' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}>
                              {account.status === 'available' ? 'พร้อมใช้' : 'ใช้แล้ว'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => deleteItemFromTable('app_284beb8f90_chicken_accounts', account.id)}
                              className="bg-red-500/20 text-red-300 hover:bg-red-500/30"
                            >
                              ลบ
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'rainbow' && (
          <Card className="bg-white/10 backdrop-blur-xl border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <span>🎮</span>
                <span>คำขอ Rainbow Six</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rainbowRequests.length === 0 ? (
                  <p className="text-white/70 text-center py-8">ไม่มีคำขอ Rainbow Six</p>
                ) : (
                  rainbowRequests.map((request) => (
                    <div key={request.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-white/60 text-sm">อีเมล Ubisoft</p>
                          <p className="text-white font-medium">{request.ubisoftEmail}</p>
                        </div>
                        <div>
                          <p className="text-white/60 text-sm">รหัสผ่าน Ubisoft</p>
                          <p className="text-white font-medium font-mono bg-white/10 px-2 py-1 rounded">
                            {request.ubisoftPassword}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/60 text-sm">โค้ดแลกรับ</p>
                          <p className="text-white font-medium font-mono bg-white/10 px-2 py-1 rounded">
                            {request.redeemCode}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/60 text-sm">จำนวน R6 Credits</p>
                          <p className="text-yellow-400 font-bold text-lg">
                            {request.credits?.toLocaleString()} Credits
                          </p>
                        </div>
                        <div>
                          <p className="text-white/60 text-sm">ข้อมูลติดต่อ</p>
                          <p className="text-white font-medium">{request.contact}</p>
                        </div>
                        <div>
                          <p className="text-white/60 text-sm">เบอร์โทรศัพท์</p>
                          <p className="text-white font-medium font-mono bg-white/10 px-2 py-1 rounded">
                            {request.phoneNumber || 'ไม่มีข้อมูล'}
                          </p>
                        </div>
                        {request.hasXboxAccount && (
                          <>
                            <div>
                              <p className="text-white/60 text-sm">อีเมล Xbox</p>
                              <p className="text-white font-medium">{request.xboxEmail}</p>
                            </div>
                            <div>
                              <p className="text-white/60 text-sm">รหัสผ่าน Xbox</p>
                              <p className="text-white font-medium font-mono bg-white/10 px-2 py-1 rounded">
                                {request.xboxPassword}
                              </p>
                            </div>
                          </>
                        )}
                        <div>
                          <p className="text-white/60 text-sm">สถานะ</p>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            request.status === 'completed' ? 'bg-green-600 text-white' :
                            request.status === 'pending' ? 'bg-yellow-600 text-white' :
                            'bg-red-600 text-white'
                          }`}>
                            {request.status === 'completed' ? 'เสร็จสิ้น' :
                             request.status === 'pending' ? 'รอดำเนินการ' : 'ยกเลิก'}
                          </span>
                        </div>
                        <div>
                          <p className="text-white/60 text-sm">วันที่สร้าง</p>
                          <p className="text-white font-medium">
                            {new Date(request.created_at).toLocaleDateString('th-TH')}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/60 text-sm">จัดการ</p>
                          <div className="flex space-x-2 mt-1">
                            <Button
                              size="sm"
                              onClick={() => updateRainbowRequestStatus(request.id, 'completed')}
                              className="bg-green-500/20 text-green-300 hover:bg-green-500/30 text-xs"
                              disabled={request.status === 'completed'}
                            >
                              เสร็จสิ้น
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => updateRainbowRequestStatus(request.id, 'rejected')}
                              className="bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs"
                              disabled={request.status === 'rejected'}
                            >
                              ยกเลิก
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => deleteRainbowRequest(request.id)}
                              className="bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 text-xs"
                            >
                              ลบคิว
                            </Button>
                          </div>
                        </div>
                      </div>
                      {request.hasXboxAccount && (
                        <div className="mt-3 p-2 bg-blue-900/30 border border-blue-500/30 rounded">
                          <p className="text-blue-200 text-sm">
                            <span className="font-medium">🎮 มีบัญชี Xbox เชื่อมต่อ</span>
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <CardTitle className="text-white">📢 เพิ่มประกาศใหม่</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="หัวข้อ (ไม่บังคับ)"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                  <Select onValueChange={(value) => setNewAnnouncement(prev => ({ ...prev, type: value as 'info' | 'warning' | 'critical' }))}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="ประเภท" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="ลิงก์ (ไม่บังคับ)"
                    value={newAnnouncement.link}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, link: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                  <Select onValueChange={(value) => setNewAnnouncement(prev => ({ ...prev, is_active: value === 'true' }))}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="สถานะ" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="true">แสดง</SelectItem>
                      <SelectItem value="false">ซ่อน</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="ข้อความประกาศ"
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 md:col-span-2 min-h-[120px]"
                  />
                  <Button onClick={addAnnouncement} className="bg-gradient-to-r from-cyan-600 to-blue-600 md:col-span-2">
                    บันทึกประกาศ
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <CardTitle className="text-white">📜 รายการประกาศ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead className="text-white">หัวข้อ</TableHead>
                        <TableHead className="text-white">ข้อความ</TableHead>
                        <TableHead className="text-white">ประเภท</TableHead>
                        <TableHead className="text-white">สถานะ</TableHead>
                        <TableHead className="text-white">วันที่</TableHead>
                        <TableHead className="text-white">จัดการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {announcements.length === 0 ? (
                        <TableRow className="border-white/10">
                          <TableCell colSpan={6} className="text-center text-white/70 py-8">ไม่มีประกาศ</TableCell>
                        </TableRow>
                      ) : announcements.map(a => (
                        <TableRow key={a.id} className="border-white/10">
                          <TableCell className="text-white">{a.title || '-'}</TableCell>
                          <TableCell className="text-white max-w-[400px] truncate" title={a.content}>{a.content}</TableCell>
                          <TableCell className="text-white">{a.type || 'info'}</TableCell>
                          <TableCell>
                            <Badge className={a.is_active ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}>
                              {a.is_active ? 'แสดง' : 'ซ่อน'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-white text-xs">{a.created_at ? new Date(a.created_at).toLocaleDateString('th-TH') : '-'}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-xs" onClick={() => toggleAnnouncementActive(a.id, !a.is_active)}>
                                {a.is_active ? 'ซ่อน' : 'แสดง'}
                              </Button>
                              <Button size="sm" className="bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs" onClick={() => deleteAnnouncement(a.id)}>
                                ลบ
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'add-rainbow' && (
          <div className="space-y-6">
          <Card className="bg-white/10 backdrop-blur-xl border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <span className="text-2xl">➕</span>
                <span>เพิ่มโค้ด Rainbow Six</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddRainbowCode} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rainbow-code" className="text-white/80">โค้ด Rainbow Six</Label>
                    <Input
                      id="rainbow-code"
                      value={newRainbowCode.code}
                      onChange={(e) => setNewRainbowCode(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="กรอกโค้ด Rainbow Six"
                      className="border-white/20 bg-white/10 text-white placeholder:text-white/50 font-mono uppercase"
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="r6-credits" className="text-white/80">จำนวน R6 Credits</Label>
                    <Input
                      id="r6-credits"
                      type="number"
                      value={newRainbowCode.credits}
                      onChange={(e) => setNewRainbowCode(prev => ({ ...prev, credits: e.target.value }))}
                      placeholder="เช่น 1200"
                      className="border-white/20 bg-white/10 text-white placeholder:text-white/50"
                      min="1"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    type="submit"
                    disabled={isAddingRainbowCode}
                    className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold py-3"
                  >
                    {isAddingRainbowCode ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>กำลังเพิ่มโค้ด...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span>➕</span>
                        <span>เพิ่มโค้ดเดี่ยว</span>
                      </div>
                    )}
                  </Button>
                  
                  <Button 
                    type="button"
                    onClick={() => setShowBulkRainbowModal(true)}
                    disabled={isAddingRainbowCode}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span>📦</span>
                      <span>เพิ่มโค้ด Bulk</span>
                    </div>
                  </Button>
                </div>
              </form>
              
              <div className="mt-6 bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
                <h4 className="text-blue-200 font-medium mb-2">💡 คำแนะนำ</h4>
                <p className="text-blue-100 text-sm">
                  • โค้ดจะถูกแปลงเป็นตัวพิมพ์ใหญ่อัตโนมัติ<br/>
                  • จำนวน R6 Credits ต้องเป็นตัวเลขบวกเท่านั้น<br/>
                  • โค้ดที่เพิ่มจะมีสถานะ "available" (พร้อมใช้งาน)<br/>
                  • สามารถใช้โค้ดนี้ในหน้าแลกรับได้ทันที
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Rainbow Six Codes List */}
          <Card id="rainbow-six-codes-list" className="bg-white/10 backdrop-blur-xl border-white/20 mt-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <span className="text-2xl">🎮</span>
                <span>รายการโค้ด Rainbow Six Credits</span>
                <Badge className="bg-cyan-500/20 text-cyan-300 ml-auto">
                  {codes.filter(code => code.status === 'active').length} โค้ด
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/20 hover:bg-white/5">
                      <TableHead className="text-white font-semibold">โค้ด</TableHead>
                      <TableHead className="text-white font-semibold">R6 Credits</TableHead>
                      <TableHead className="text-white font-semibold">สถานะ</TableHead>
                      <TableHead className="text-white font-semibold">วันที่เพิ่ม</TableHead>
                      <TableHead className="text-white font-semibold">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {codes.map((code) => (
                      <TableRow key={code.id} className="border-white/10 hover:bg-white/5">
                        <TableCell className="text-white font-mono text-sm bg-gray-800/50 rounded px-2 py-1">
                          {code.code}
                        </TableCell>
                        <TableCell className="text-cyan-300 font-bold text-lg">
                          {code.robux_value.toString()} Credits
                        </TableCell>
                        <TableCell>
                          <Badge className={code.status === 'active' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}>
                            {code.status === 'active' ? '✅ พร้อมใช้' : '❌ ใช้แล้ว'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white/70 text-sm">
                          {new Date(code.created_at).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => deleteItemFromTable('app_284beb8f90_rainbow_codes', code.id)}
                            className="bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30"
                          >
                            🗑️ ลบ
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {(() => {
                  const supabaseCodes = codes.filter(code => code.status === 'active');
                  const localCodes = JSON.parse(localStorage.getItem('redemption_codes') || '[]')
                    .filter(code => code.status === 'active');
                  const totalCodes = supabaseCodes.length + localCodes.length;
                  
                  if (totalCodes === 0) {
                    return (
                      <div className="text-center text-white/60 py-12">
                        <div className="text-6xl mb-4">🎮</div>
                        <div className="text-xl font-medium mb-2">ยังไม่มีโค้ด Rainbow Six Credits</div>
                        <div className="text-sm">เพิ่มโค้ดแรกของคุณด้านบน</div>
                      </div>
                    );
                  }
                  
                  // Display local codes if no Supabase codes
                  if (supabaseCodes.length === 0 && localCodes.length > 0) {
                    return localCodes.map((code, index) => (
                      <div key={`local-${code.id || index}`} className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-mono text-lg text-white">{code.code}</div>
                            <div className="text-sm text-white/60">{code.robux_value} Credits</div>
                            <div className="text-xs text-green-400">บันทึกในเครื่อง</div>
                          </div>
                          <div className="text-right">
                            <div className={`px-2 py-1 rounded text-xs ${
                              code.status === 'available' ? 'bg-green-500/20 text-green-400' :
                              code.status === 'used' ? 'bg-red-500/20 text-red-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {code.status === 'available' ? 'พร้อมใช้งาน' :
                               code.status === 'used' ? 'ใช้แล้ว' : 'ไม่พร้อมใช้'}
                            </div>
                            <div className="text-xs text-white/40 mt-1">
                              {new Date(code.created_at).toLocaleDateString('th-TH')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ));
                  }
                  
                  return null;
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {/* Bulk Import Dialog */}
        <Dialog open={showBulkImportDialog} onOpenChange={setShowBulkImportDialog}>
          <DialogContent className="bg-gray-900 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Upload className="w-5 h-5 text-blue-400" />
                <span>นำเข้าข้อมูลหลายรายการ</span>
                <Badge className="bg-blue-500/20 text-blue-300">
                  {bulkImportType === 'codes' ? 'โค้ด Robux' : 'บัญชีไก่ตัน'}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {bulkImportType === 'codes' ? (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-300 mb-2">รูปแบบข้อมูลโค้ด Robux:</h4>
                  <div className="bg-gray-800 rounded p-3 font-mono text-sm">
                    <div className="text-gray-400 mb-2">รูปแบบ: โค้ด,จำนวน Robux</div>
                    <div className="text-green-400">ROBUX100,100</div>
                    <div className="text-green-400">ROBUX200,200</div>
                    <div className="text-green-400">ROBUX500,500</div>
                  </div>
                </div>
              ) : (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-300 mb-2">รูปแบบข้อมูลบัญชีไก่ตัน:</h4>
                  <div className="bg-gray-800 rounded p-3 font-mono text-sm">
                    <div className="text-gray-400 mb-2">รูปแบบ: โค้ด,ประเภทบัญชี,ชื่อผู้ใช้,รหัสผ่าน,หมายเหตุ</div>
                    <div className="text-green-400">CHICKEN01,Bone Blossom,user123,pass123,Premium Account</div>
                    <div className="text-green-400">CHICKEN02,Butterfly,user456,pass456,</div>
                    <div className="text-green-400">CHICKEN03,Royal Wings,user789,pass789,VIP Account</div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  ข้อมูลที่ต้องการนำเข้า (แต่ละบรรทัดคือรายการเดียว)
                </label>
                <Textarea
                  value={bulkImportData}
                  onChange={(e) => setBulkImportData(e.target.value)}
                  placeholder={bulkImportType === 'codes' 
                    ? "ROBUX100,100\nROBUX200,200\nROBUX500,500" 
                    : "CHICKEN01,Bone Blossom,user123,pass123,Premium Account\nCHICKEN02,Butterfly,user456,pass456,\nCHICKEN03,Royal Wings,user789,pass789,VIP Account"
                  }
                  className="bg-gray-800 border-gray-600 text-white min-h-[200px] font-mono text-sm"
                  rows={10}
                />
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <p className="text-yellow-200 text-sm">
                  <strong>คำแนะนำ:</strong>
                  <br />• ใส่ข้อมูลทีละบรรทัด
                  <br />• ใช้เครื่องหมายคอมมา (,) คั่นระหว่างข้อมูล
                  <br />• สำหรับบัญชีไก่ตัน หากไม่มีหมายเหตุให้เว้นว่างหลังคอมมาสุดท้าย
                  <br />• ตรวจสอบรูปแบบให้ถูกต้องก่อนกดนำเข้า
                </p>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowBulkImportDialog(false)}
                  variant="outline"
                  className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  ยกเลิก
                </Button>
                <Button
                  onClick={handleBulkImport}
                  disabled={isProcessingBulk || !bulkImportData.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isProcessingBulk ? 'กำลังนำเข้า...' : `📥 นำเข้าข้อมูล`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Bulk Rainbow Six Codes Modal */}
      <Dialog open={showBulkRainbowModal} onOpenChange={setShowBulkRainbowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-white">
              <span className="text-3xl">🎮</span>
              เพิ่มโค้ด Rainbow Six แบบ Bulk
            </DialogTitle>
            <DialogDescription className="text-base text-gray-200">
              กรอกโค้ดและเครดิตในรูปแบบ: <code className="bg-blue-500/30 px-2 py-1 rounded font-mono text-blue-200 border border-blue-400/50">โค้ด,เครดิต</code> (หนึ่งบรรทัดต่อหนึ่งโค้ด)
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleBulkAddRainbowCodes} className="space-y-6">
            {/* Input Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Input */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bulk-codes" className="text-base font-semibold text-white mb-2 block">
                    📝 โค้ด Rainbow Six
                  </Label>
                  <textarea
                    id="bulk-codes"
                    value={bulkRainbowCodes}
                    onChange={(e) => setBulkRainbowCodes(e.target.value)}
                    placeholder={`RBX123,1800
RBX456,1800
RBX789,2400
RBX999,1200
RBX888,3600`}
                    className="w-full h-64 p-4 border-2 border-white/30 rounded-lg resize-none font-mono text-base bg-black/20 text-white placeholder:text-white/50 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm"
                    rows={12}
                  />
                </div>
                
                {/* Quick Actions */}
                <div className="flex gap-2">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setBulkRainbowCodes('')}
                    className="flex-1 bg-red-500/20 border-red-400/50 text-red-300 hover:bg-red-500/30 hover:border-red-400 hover:text-red-200"
                  >
                    🗑️ ล้างข้อมูล
                  </Button>
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const sampleCodes = `RBX001,1800
RBX002,1800
RBX003,2400
RBX004,1200
RBX005,3600`;
                      setBulkRainbowCodes(sampleCodes);
                    }}
                    className="flex-1 bg-blue-500/20 border-blue-400/50 text-blue-300 hover:bg-blue-500/30 hover:border-blue-400 hover:text-blue-200"
                  >
                    📋 ตัวอย่าง
                  </Button>
                </div>
              </div>

              {/* Right Column - Preview & Info */}
              <div className="space-y-4">
                {/* Preview Section */}
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                    <span className="text-lg">👁️</span>
                    ตัวอย่างข้อมูล
                  </h4>
                  <div className="bg-black/20 rounded border border-white/10 p-3 font-mono text-sm space-y-1">
                    <div className="text-white font-semibold mb-2">รูปแบบที่ถูกต้อง:</div>
                    <div className="text-green-400 font-medium">RBX123,1800 ✓</div>
                    <div className="text-green-400 font-medium">RBX456,2400 ✓</div>
                    <div className="text-red-400 font-medium">RBX789 (ไม่มีเครดิต) ✗</div>
                    <div className="text-red-400 font-medium">RBX999,abc (เครดิตไม่ใช่ตัวเลข) ✗</div>
                  </div>
                </div>

                {/* Real-time Preview */}
                {bulkRainbowCodes.trim() && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <span className="text-lg">📊</span>
                      ข้อมูลที่จะนำเข้า
                    </h4>
                    
                    {/* Summary */}
                    <div className="mb-3 p-2 bg-blue-500/20 rounded text-sm border border-blue-400/30">
                      <div className="flex justify-between items-center text-white">
                        <span>✅ ถูกต้อง: <strong className="text-green-400">{bulkPreview.valid.length}</strong> โค้ด</span>
                        <span>❌ ผิดพลาด: <strong className="text-red-400">{bulkPreview.invalid.length}</strong> บรรทัด</span>
                      </div>
                    </div>

                    {/* Valid Codes Preview */}
                    {bulkPreview.valid.length > 0 && (
                      <div className="mb-3">
                        <div className="text-sm font-medium text-green-400 mb-2">✅ โค้ดที่ถูกต้อง:</div>
                        <div className="max-h-32 overflow-y-auto bg-green-500/10 rounded p-2 space-y-1 border border-green-400/20">
                          {bulkPreview.valid.slice(0, 5).map((code, index) => (
                            <div key={index} className="text-xs text-green-300 font-mono">
                              {code.code} → {code.credits} Credits
                            </div>
                          ))}
                          {bulkPreview.valid.length > 5 && (
                            <div className="text-xs text-green-400 italic">
                              ... และอีก {bulkPreview.valid.length - 5} โค้ด
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Invalid Lines Preview */}
                    {bulkPreview.invalid.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-red-400 mb-2">❌ บรรทัดที่ผิดพลาด:</div>
                        <div className="max-h-24 overflow-y-auto bg-red-500/10 rounded p-2 space-y-1 border border-red-400/20">
                          {bulkPreview.invalid.slice(0, 3).map((line, index) => (
                            <div key={index} className="text-xs text-red-300 font-mono">
                              "{line}"
                            </div>
                          ))}
                          {bulkPreview.invalid.length > 3 && (
                            <div className="text-xs text-red-400 italic">
                              ... และอีก {bulkPreview.invalid.length - 3} บรรทัด
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Instructions */}
                <div className="bg-blue-500/10 backdrop-blur-sm rounded-lg p-4 border border-blue-400/30">
                  <h4 className="font-semibold text-blue-300 mb-3 flex items-center gap-2">
                    <span className="text-lg">💡</span>
                    คำแนะนำ
                  </h4>
                  <div className="space-y-2 text-sm text-blue-200">
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      <span>ใส่ข้อมูลทีละบรรทัด</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      <span>ใช้เครื่องหมายคอมมา (,) คั่นระหว่างโค้ดและเครดิต</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      <span>โค้ดจะถูกแปลงเป็นตัวพิมพ์ใหญ่อัตโนมัติ</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      <span>จำนวนเครดิตต้องเป็นตัวเลขบวกเท่านั้น</span>
                    </div>
                  </div>
                </div>

                {/* Validation Info */}
                <div className="bg-yellow-500/10 backdrop-blur-sm rounded-lg p-4 border border-yellow-400/30">
                  <h4 className="font-semibold text-yellow-300 mb-3 flex items-center gap-2">
                    <span className="text-lg">⚠️</span>
                    หมายเหตุ
                  </h4>
                  <div className="text-sm text-yellow-200">
                    <p>• ระบบจะข้ามบรรทัดที่รูปแบบผิด</p>
                    <p>• บรรทัดว่างจะถูกละเว้น</p>
                    <p>• สามารถนำเข้าข้อมูลได้ไม่จำกัดจำนวน</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-white/20">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowBulkRainbowModal(false)}
                disabled={isAddingRainbowCode}
                className="flex-1 h-12 text-base bg-gray-500/20 border-gray-400/50 text-gray-300 hover:bg-gray-500/30 hover:border-gray-400 hover:text-gray-200"
              >
                ❌ ยกเลิก
              </Button>
              <Button 
                type="submit" 
                className="flex-1 h-12 text-base bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg"
                disabled={isAddingRainbowCode || !bulkRainbowCodes.trim()}
              >
                {isAddingRainbowCode ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>กำลังเพิ่ม...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📦</span>
                    <span>เพิ่มโค้ดทั้งหมด</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ระบบคิว */}
      {activeTab === 'queue' && (
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <QueueManager />
        </div>
      )}
    </div>
  );
}