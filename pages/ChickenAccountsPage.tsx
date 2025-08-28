import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChickenAccount } from "@/types";
import { 
  ArrowLeft,
  Gift, 
  Plus,
  FileUp,
  Search,
  Filter,
  Edit,
  Trash2,
  Download,
  Upload,
  Eye,
  EyeOff
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ChickenAccountsPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [accounts, setAccounts] = useState<ChickenAccount[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<ChickenAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [showPasswords, setShowPasswords] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ChickenAccount | null>(null);
  const [newAccount, setNewAccount] = useState({
    login_code: '',
    username: '',
    password: '',
    product_name: ''
  });
  
  // Stats
  const totalAccounts = accounts.length;
  const availableAccounts = accounts.filter(acc => acc.status === 'available').length;
  const usedAccounts = accounts.filter(acc => acc.status === 'used').length;
  const products = [...new Set(accounts.map(acc => acc.product_name).filter(Boolean))];

  useEffect(() => {
    if (!user || !isAdmin) {
      navigate("/login");
      return;
    }
    
    fetchAccounts();
  }, [user, isAdmin, navigate]);

  useEffect(() => {
    filterAccounts();
  }, [accounts, searchTerm, statusFilter, productFilter]);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_chicken_accounts")
        .select("*")
        .order("created_at", { ascending: false });
        
      if (error) {
        console.error("Error fetching chicken accounts:", error);
      } else {
        setAccounts(data || []);
      }
    } catch (error) {
      console.error("Error in fetchAccounts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAccounts = () => {
    let filtered = accounts;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(acc => acc.status === statusFilter);
    }

    // Product filter
    if (productFilter !== 'all') {
      filtered = filtered.filter(acc => acc.product_name === productFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(acc => 
        (acc.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.password.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAccounts(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-500/20 text-green-300 border-green-500/30">พร้อมใช้</Badge>;
      case 'used':
        return <Badge className="bg-red-500/20 text-red-300 border-red-500/30">ใช้แล้ว</Badge>;
      default:
        return <Badge className="bg-white/20 text-white/70 border-white/30">{status}</Badge>;
    }
  };

  const exportAccounts = () => {
    const csvContent = [
      ['Login Code', 'Username', 'Password', 'Product', 'Status', 'Created Date'],
      ...filteredAccounts.map(acc => [
        acc.code,
        acc.username,
        acc.password,
        acc.product_name || '',
        acc.status,
        new Date(acc.created_at).toLocaleDateString('th-TH')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chicken_accounts_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleAddAccount = async () => {
    try {
      const { data, error } = await supabase
        .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_chicken_accounts")
        .insert([{
          code: newAccount.login_code,
          username: newAccount.username,
          password: newAccount.password,
          product_name: newAccount.product_name,
          status: 'available'
        }]);

      if (error) {
        console.error('Error adding account:', error);
        alert('เกิดข้อผิดพลาดในการเพิ่มบัญชี');
      } else {
        setNewAccount({ login_code: '', username: '', password: '', product_name: '' });
        setIsAddDialogOpen(false);
        fetchAccounts();
        alert('เพิ่มบัญชีสำเร็จ');
      }
    } catch (error) {
      console.error('Error in handleAddAccount:', error);
      alert('เกิดข้อผิดพลาดในการเพิ่มบัญชี');
    }
  };

  const handleEditAccount = async () => {
    if (!editingAccount) return;
    
    try {
      const { data, error } = await supabase
        .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_chicken_accounts")
        .update({
          code: editingAccount.code,
          username: editingAccount.username,
          password: editingAccount.password,
          product_name: editingAccount.product_name
        })
        .eq('id', editingAccount.id);

      if (error) {
        console.error('Error updating account:', error);
        alert('เกิดข้อผิดพลาดในการแก้ไขบัญชี');
      } else {
        setEditingAccount(null);
        setIsEditDialogOpen(false);
        fetchAccounts();
        alert('แก้ไขบัญชีสำเร็จ');
      }
    } catch (error) {
      console.error('Error in handleEditAccount:', error);
      alert('เกิดข้อผิดพลาดในการแก้ไขบัญชี');
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_chicken_accounts")
        .delete()
        .eq('id', accountId);

      if (error) {
        console.error('Error deleting account:', error);
        alert('เกิดข้อผิดพลาดในการลบบัญชี');
      } else {
        fetchAccounts();
        alert('ลบบัญชีสำเร็จ');
      }
    } catch (error) {
      console.error('Error in handleDeleteAccount:', error);
      alert('เกิดข้อผิดพลาดในการลบบัญชี');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link to="/admin">
                <ArrowLeft className="w-4 h-4 mr-2" />
                กลับ
              </Link>
            </Button>
            <h1 className="text-2xl font-bold text-white">จัดการบัญชีไก่ตัน</h1>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">บัญชีทั้งหมด</p>
                  <p className="text-3xl font-bold text-white">{totalAccounts}</p>
                </div>
                <Gift className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">พร้อมใช้งาน</p>
                  <p className="text-3xl font-bold text-green-400">{availableAccounts}</p>
                </div>
                <Gift className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">ใช้แล้ว</p>
                  <p className="text-3xl font-bold text-red-400">{usedAccounts}</p>
                </div>
                <Gift className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="ค้นหาบัญชี..."
                    className="pl-10 bg-slate-700 border-slate-600 text-white w-full sm:w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40 bg-slate-700 border-slate-600 text-white">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="all">ทุกสถานะ</SelectItem>
                    <SelectItem value="available">พร้อมใช้</SelectItem>
                    <SelectItem value="used">ใช้แล้ว</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={productFilter} onValueChange={setProductFilter}>
                  <SelectTrigger className="w-full sm:w-40 bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="all">ทุกผลิตภัณฑ์</SelectItem>
                    {products.map(product => (
                      <SelectItem key={product} value={product}>{product}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                <Button
                  variant="outline"
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  onClick={() => setShowPasswords(!showPasswords)}
                >
                  {showPasswords ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                  {showPasswords ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                </Button>
                
                <Button
                  variant="outline"
                  className="bg-green-700 border-green-600 text-white hover:bg-green-600"
                  onClick={exportAccounts}
                >
                  <Download className="w-4 h-4 mr-2" />
                  ส่งออก CSV
                </Button>
                
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      เพิ่มบัญชี
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-800 border-slate-600 text-white">
                    <DialogHeader>
                      <DialogTitle>เพิ่มบัญชีไก่ตันใหม่</DialogTitle>
                      <DialogDescription className="text-slate-400">
                        กรอกข้อมูลบัญชีไก่ตันใหม่
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="login_code" className="text-right">
                          โค้ด
                        </Label>
                        <Input
                          id="login_code"
                          value={newAccount.login_code}
                          onChange={(e) => setNewAccount(prev => ({ ...prev, login_code: e.target.value }))}
                          className="col-span-3 bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="username" className="text-right">
                          ชื่อผู้ใช้
                        </Label>
                        <Input
                          id="username"
                          value={newAccount.username}
                          onChange={(e) => setNewAccount(prev => ({ ...prev, username: e.target.value }))}
                          className="col-span-3 bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">
                          รหัสผ่าน
                        </Label>
                        <Input
                          id="password"
                          value={newAccount.password}
                          onChange={(e) => setNewAccount(prev => ({ ...prev, password: e.target.value }))}
                          className="col-span-3 bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="product_name" className="text-right">
                          ผลิตภัณฑ์
                        </Label>
                        <Input
                          id="product_name"
                          value={newAccount.product_name}
                          onChange={(e) => setNewAccount(prev => ({ ...prev, product_name: e.target.value }))}
                          className="col-span-3 bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        onClick={handleAddAccount}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        เพิ่มบัญชี
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accounts Table */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-xl text-white">
              รายการบัญชีไก่ตัน ({filteredAccounts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-slate-600 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400">กำลังโหลด...</p>
              </div>
            ) : filteredAccounts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-white">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-4">โค้ด</th>
                      <th className="text-left p-4">ชื่อผู้ใช้</th>
                      <th className="text-left p-4">รหัสผ่าน</th>
                      <th className="text-left p-4">ผลิตภัณฑ์</th>
                      <th className="text-left p-4">สถานะ</th>
                      <th className="text-left p-4">วันที่สร้าง</th>
                      <th className="text-left p-4">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccounts.map((account, index) => (
                      <tr key={account.id} className={`border-b border-slate-700 ${index % 2 === 0 ? 'bg-slate-800/50' : ''}`}>
                        <td className="p-4 font-mono text-sm">
                          <div className="bg-white text-black px-2 py-1 rounded font-bold">
                            {account.code}
                          </div>
                        </td>
                        <td className="p-4 font-mono">
                          {account.username}
                        </td>
                        <td className="p-4 font-mono text-sm">
                          {showPasswords ? account.password : '••••••••'}
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                            {account.product_name || 'ไม่ระบุ'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          {getStatusBadge(account.status)}
                        </td>
                        <td className="p-4 text-slate-400 text-sm">
                          {new Date(account.created_at).toLocaleDateString('th-TH')}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-blue-400 hover:bg-blue-500/20"
                                  onClick={() => setEditingAccount(account)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-slate-800 border-slate-600 text-white">
                                <DialogHeader>
                                  <DialogTitle>แก้ไขบัญชีไก่ตัน</DialogTitle>
                                  <DialogDescription className="text-slate-400">
                                    แก้ไขข้อมูลบัญชีไก่ตัน
                                  </DialogDescription>
                                </DialogHeader>
                                {editingAccount && (
                                  <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="edit_code" className="text-right">
                                        โค้ด
                                      </Label>
                                      <Input
                                        id="edit_code"
                                        value={editingAccount.code}
                                        onChange={(e) => setEditingAccount(prev => prev ? ({ ...prev, code: e.target.value }) : null)}
                                        className="col-span-3 bg-slate-700 border-slate-600 text-white"
                                      />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="edit_username" className="text-right">
                                        ชื่อผู้ใช้
                                      </Label>
                                      <Input
                                        id="edit_username"
                                        value={editingAccount.username}
                                        onChange={(e) => setEditingAccount(prev => prev ? ({ ...prev, username: e.target.value }) : null)}
                                        className="col-span-3 bg-slate-700 border-slate-600 text-white"
                                      />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="edit_password" className="text-right">
                                        รหัสผ่าน
                                      </Label>
                                      <Input
                                        id="edit_password"
                                        value={editingAccount.password}
                                        onChange={(e) => setEditingAccount(prev => prev ? ({ ...prev, password: e.target.value }) : null)}
                                        className="col-span-3 bg-slate-700 border-slate-600 text-white"
                                      />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="edit_product_name" className="text-right">
                                        ผลิตภัณฑ์
                                      </Label>
                                      <Input
                                        id="edit_product_name"
                                        value={editingAccount.product_name || ''}
                                        onChange={(e) => setEditingAccount(prev => prev ? ({ ...prev, product_name: e.target.value }) : null)}
                                        className="col-span-3 bg-slate-700 border-slate-600 text-white"
                                      />
                                    </div>
                                  </div>
                                )}
                                <DialogFooter>
                                  <Button 
                                    type="submit" 
                                    onClick={handleEditAccount}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    บันทึกการเปลี่ยนแปลง
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-red-400 hover:bg-red-500/20"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-slate-800 border-slate-600">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-white">คุณแน่ใจหรือไม่?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-slate-400">
                                    การลบบัญชี "{account.code}" จะเป็นการลบอย่างถาวรและไม่สามารถกู้คืนได้
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-slate-700 text-white border-slate-600">ยกเลิก</AlertDialogCancel>
                                  <AlertDialogAction 
                                    className="bg-red-600 text-white hover:bg-red-700"
                                    onClick={() => handleDeleteAccount(account.id)}
                                  >
                                    ลบ
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                {accounts.length === 0 ? 'ยังไม่มีบัญชีในระบบ' : 'ไม่พบบัญชีที่ตรงกับเงื่อนไข'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}