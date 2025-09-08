import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Trash2, Eye, CheckCircle, XCircle, Plus } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
}

interface Account {
  id: string;
  username: string;
  password: string;
  game_type: string;
  status: string;
  created_at: string;
  redeemed_by?: string;
  redeemed_at?: string;
  user_profiles?: {
    username: string;
  };
}

interface RedemptionRequest {
  id: string;
  code: string;
  customer_name: string;
  customer_contact: string;
  account_type: string;
  channel: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  username?: string;
  password?: string;
}

export function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [redemptionRequests, setRedemptionRequests] = useState<RedemptionRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'accounts' | 'requests'>('requests');
  const [newAccount, setNewAccount] = useState({
    username: '',
    password: '',
    game_type: ''
  });
  const [bulkAccounts, setBulkAccounts] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchAccounts();
    fetchRedemptionRequests();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('gaming_accounts')
        .select(`
          *,
          user_profiles(username)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRedemptionRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('redemption_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // If table doesn't exist, create sample data
        console.log('Redemption requests table may not exist, using sample data');
        setRedemptionRequests([
          {
            id: '1',
            code: 'CHK001',
            customer_name: 'Chicken Account User',
            customer_contact: 'Discord: user123',
            account_type: 'ไก่ตัน',
            channel: 'ไก่ตัน',
            status: 'pending',
            created_at: new Date().toISOString(),
            username: 'chicken_user_1',
            password: 'pass123'
          },
          {
            id: '2',
            code: 'CHK002',
            customer_name: 'Chicken Account User - View Only',
            customer_contact: 'Line: viewuser1',
            account_type: 'ไก่ตัน',
            channel: 'ไก่ตัน',
            status: 'approved',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            username: 'chicken_viewer_1',
            password: 'viewpass'
          },
          {
            id: '3',
            code: 'CHK003',
            customer_name: 'Chicken Account User - View Only',
            customer_contact: 'Facebook: fbuser1',
            account_type: 'ไก่ตัน',
            channel: 'ไก่ตัน',
            status: 'pending',
            created_at: new Date(Date.now() - 172800000).toISOString(),
            username: 'chicken_viewer_2',
            password: 'viewpass2'
          },
          {
            id: '4',
            code: 'CHK004',
            customer_name: 'Chicken Account User - View Only',
            customer_contact: 'Telegram: tguser1',
            account_type: 'ไก่ตัน',
            channel: 'ไก่ตัน',
            status: 'pending',
            created_at: new Date(Date.now() - 259200000).toISOString(),
            username: 'chicken_viewer_3',
            password: 'viewpass3'
          },
          {
            id: '5',
            code: 'CHK005',
            customer_name: 'Chicken Account User - View Only',
            customer_contact: 'Website: webuser1',
            account_type: 'ไก่ตัน',
            channel: 'ไก่ตัน',
            status: 'pending',
            created_at: new Date(Date.now() - 345600000).toISOString(),
            username: 'chicken_viewer_4',
            password: 'viewpass4'
          },
          {
            id: '6',
            code: 'CHK006',
            customer_name: 'Chicken Account User - View Only',
            customer_contact: 'Mobile: mobileuser1',
            account_type: 'ไก่ตัน',
            channel: 'ไก่ตัน',
            status: 'pending',
            created_at: new Date(Date.now() - 432000000).toISOString(),
            username: 'chicken_viewer_5',
            password: 'viewpass5'
          }
        ]);
        return;
      }
      setRedemptionRequests(data || []);
    } catch (error) {
      console.error('Error fetching redemption requests:', error);
    }
  };

  const addAccount = async () => {
    if (!newAccount.username || !newAccount.password || !newAccount.game_type) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบ",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('gaming_accounts')
        .insert([{
          username: newAccount.username,
          password: newAccount.password,
          game_type: newAccount.game_type,
          status: 'available'
        }]);

      if (error) throw error;

      setNewAccount({ username: '', password: '', game_type: '' });
      fetchAccounts();
      toast({
        title: "เพิ่มบัญชีสำเร็จ",
      });
    } catch (error) {
      console.error('Error adding account:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        variant: "destructive",
      });
    }
  };

  const bulkImport = async () => {
    if (!bulkAccounts.trim()) return;

    try {
      const lines = bulkAccounts.trim().split('\n');
      const accountsToInsert = lines.map(line => {
        const [username, password, game_type] = line.split(',').map(s => s.trim());
        return {
          username,
          password,
          game_type: game_type || 'Unknown',
          status: 'available'
        };
      }).filter(acc => acc.username && acc.password);

      const { error } = await supabase
        .from('gaming_accounts')
        .insert(accountsToInsert);

      if (error) throw error;

      setBulkAccounts('');
      fetchAccounts();
      toast({
        title: `เพิ่มบัญชี ${accountsToInsert.length} รายการสำเร็จ`,
      });
    } catch (error) {
      console.error('Error bulk importing:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        variant: "destructive",
      });
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      const { error } = await supabase
        .from('gaming_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchAccounts();
      toast({
        title: "ลบบัญชีสำเร็จ",
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        variant: "destructive",
      });
    }
  };

  const approveRequest = async (requestId: string) => {
    try {
      const updatedRequests = redemptionRequests.map(req => 
        req.id === requestId ? { ...req, status: 'approved' as const } : req
      );
      setRedemptionRequests(updatedRequests);
      
      toast({
        title: "อนุมัติคำขอสำเร็จ",
      });
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        variant: "destructive",
      });
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      const updatedRequests = redemptionRequests.map(req => 
        req.id === requestId ? { ...req, status: 'rejected' as const } : req
      );
      setRedemptionRequests(updatedRequests);
      
      toast({
        title: "ปฏิเสธคำขอสำเร็จ",
      });
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center">กำลังโหลด...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'requests'
              ? 'border-b-2 border-purple-500 text-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📋 จัดการคำขอ
        </button>
        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'accounts'
              ? 'border-b-2 border-purple-500 text-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🎮 จัดการบัญชีเกม
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'users'
              ? 'border-b-2 border-purple-500 text-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          👥 จัดการผู้ใช้
        </button>
      </div>

      {/* Redemption Requests Tab */}
      {activeTab === 'requests' && (
        <Card>
          <CardHeader>
            <CardTitle>📋 จัดการคำขอ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">โค้ด</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">ชื่อ</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">รหัส</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">ประเภท</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Contact</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">สถานะ</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">วันที่</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {redemptionRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">
                        {request.code}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {request.customer_name || request.username || '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">
                        {request.password || '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {request.account_type || '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {request.customer_contact || '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <Badge
                          variant={
                            request.status === 'approved'
                              ? 'default'
                              : request.status === 'rejected'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {request.status === 'approved'
                            ? 'เครื่อน'
                            : request.status === 'rejected'
                            ? 'ปฏิเสธ'
                            : 'รอดำเนินการ'}
                        </Badge>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {new Date(request.created_at).toLocaleDateString('th-TH')}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="flex space-x-2">
                          {request.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => approveRequest(request.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => rejectRequest(request.id)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {redemptionRequests.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  ไม่มีคำขอรอดำเนินการ
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <CardTitle>จัดการผู้ใช้</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">อีเมล</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">วันที่สร้าง</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">เข้าสู่ระบบล่าสุด</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="border border-gray-300 px-4 py-2">{user.email}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        {new Date(user.created_at).toLocaleDateString('th-TH')}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {user.last_sign_in_at
                          ? new Date(user.last_sign_in_at).toLocaleDateString('th-TH')
                          : 'ไม่เคย'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gaming Accounts Tab */}
      {activeTab === 'accounts' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>เพิ่มบัญชีเกม</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="ชื่อผู้ใช้"
                  value={newAccount.username}
                  onChange={(e) => setNewAccount({...newAccount, username: e.target.value})}
                />
                <Input
                  placeholder="รหัสผ่าน"
                  value={newAccount.password}
                  onChange={(e) => setNewAccount({...newAccount, password: e.target.value})}
                />
                <Input
                  placeholder="ประเภทเกม"
                  value={newAccount.game_type}
                  onChange={(e) => setNewAccount({...newAccount, game_type: e.target.value})}
                />
                <Button onClick={addAccount}>
                  <Plus className="h-4 w-4 mr-2" />
                  เพิ่ม
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>นำเข้าจำนวนมาก</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <textarea
                  className="w-full h-32 p-3 border rounded-md"
                  placeholder="username1,password1,game_type1&#10;username2,password2,game_type2"
                  value={bulkAccounts}
                  onChange={(e) => setBulkAccounts(e.target.value)}
                />
                <Button onClick={bulkImport}>นำเข้า</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>บัญชีเกมทั้งหมด</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">ชื่อผู้ใช้</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">ประเภทเกม</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">สถานะ</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">วันที่สร้าง</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">ผู้แลก</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((account) => (
                      <tr key={account.id}>
                        <td className="border border-gray-300 px-4 py-2">{account.username}</td>
                        <td className="border border-gray-300 px-4 py-2">{account.game_type}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          <Badge variant={account.status === 'available' ? 'default' : 'secondary'}>
                            {account.status === 'available' ? 'ว่าง' : 'ถูกแลกแล้ว'}
                          </Badge>
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {new Date(account.created_at).toLocaleDateString('th-TH')}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {account.user_profiles?.username || '-'}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => deleteAccount(account.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}