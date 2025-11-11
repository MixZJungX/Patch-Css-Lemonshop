import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Download, 
  Upload,
  Edit,
  Trash2,
  Save,
  X,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ChickenAccount } from "@/types";

export default function ChickenAccounts() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [accounts, setAccounts] = useState<ChickenAccount[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<ChickenAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [productFilter, setProductFilter] = useState<string>("all");
  
  // Add new account states
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({
    username: "",
    password: "",
    product_name: "",
    notes: ""
  });
  
  // Edit account states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingAccount, setEditingAccount] = useState<Partial<ChickenAccount>>({});
  // Bulk import states
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [bulkMode, setBulkMode] = useState<'normal' | 'codeType'>('normal');
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null);

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
    
    if (searchTerm) {
      filtered = filtered.filter(account => 
        account.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (account.notes && account.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(account => account.status === statusFilter);
    }
    
    if (productFilter !== "all") {
      filtered = filtered.filter(account => account.product_name === productFilter);
    }
    
    setFilteredAccounts(filtered);
  };

  const addAccount = async () => {
    if (!newAccount.username || !newAccount.password || !newAccount.product_name) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    try {
      const { error } = await supabase
        .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_chicken_accounts")
        .insert([{
          username: newAccount.username,
          password: newAccount.password,
          product_name: newAccount.product_name,
          notes: newAccount.notes,
          status: "available"
        }]);
        
      if (error) {
        console.error("Error adding account:", error);
        alert("เกิดข้อผิดพลาดในการเพิ่มบัญชี");
      } else {
        setNewAccount({ username: "", password: "", product_name: "", notes: "" });
        setIsAddingAccount(false);
        fetchAccounts();
      }
    } catch (error) {
      console.error("Error in addAccount:", error);
      alert("เกิดข้อผิดพลาดในการเพิ่มบัญชี");
    }
  };

  const updateAccount = async (id: string) => {
    try {
      const { error } = await supabase
        .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_chicken_accounts")
        .update(editingAccount)
        .eq("id", id);
        
      if (error) {
        console.error("Error updating account:", error);
        alert("เกิดข้อผิดพลาดในการอัปเดตบัญชี");
      } else {
        setEditingId(null);
        setEditingAccount({});
        fetchAccounts();
      }
    } catch (error) {
      console.error("Error in updateAccount:", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตบัญชี");
    }
  };

  const deleteAccount = async (id: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบบัญชีนี้?")) return;

    try {
      const { error } = await supabase
        .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_chicken_accounts")
        .delete()
        .eq("id", id);
        
      if (error) {
        console.error("Error deleting account:", error);
        alert("เกิดข้อผิดพลาดในการลบบัญชี");
      } else {
        fetchAccounts();
      }
    } catch (error) {
      console.error("Error in deleteAccount:", error);
      alert("เกิดข้อผิดพลาดในการลบบัญชี");
    }
  };

  const exportToCSV = () => {
    const csv = [
      ["Username", "Password", "Product", "Status", "Notes", "Created At"],
      ...filteredAccounts.map(account => [
        account.username,
        account.password,
        account.product_name,
        account.status,
        account.notes || "",
        new Date(account.created_at).toLocaleString("th-TH")
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `chicken-accounts-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />พร้อมใช้</Badge>;
      case "used":
        return <Badge variant="outline" className="bg-red-500/20 text-red-300 border-red-500/30"><Clock className="w-3 h-3 mr-1" />ใช้แล้ว</Badge>;
      case "maintenance":
        return <Badge variant="outline" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30"><AlertCircle className="w-3 h-3 mr-1" />ปรับปรุง</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const uniqueProducts = [...new Set(accounts.map(acc => acc.product_name))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-2 md:p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%224%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 md:pt-8 px-2">
          <div className="text-center sm:text-left">
            <div className="flex justify-center sm:justify-start mb-4">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-2xl">
                <span className="text-2xl md:text-3xl">🐔</span>
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-thai bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent mb-2 text-shadow-lg">จัดการบัญชีไก่ตัน</h1>
            <p className="text-white/70 text-sm md:text-base font-thai-body text-shadow">บริหารจัดการบัญชีเกมและสินค้าดิจิทัล</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-xl shadow-lg transition-all duration-300 hover:scale-105 font-thai" 
              onClick={() => navigate("/admin")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับแดชบอร์ด
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-4 md:p-6">
              <div className="text-center">
                <p className="text-sm font-medium text-white/70 font-thai-body">ทั้งหมด</p>
                <p className="text-2xl font-bold text-white font-thai text-shadow">{accounts.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-4 md:p-6">
              <div className="text-center">
                <p className="text-sm font-medium text-white/70 font-thai-body">พร้อมใช้</p>
                <p className="text-2xl font-bold text-green-300 font-thai text-shadow">{accounts.filter(acc => acc.status === 'available').length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-4 md:p-6">
              <div className="text-center">
                <p className="text-sm font-medium text-white/70 font-thai-body">ใช้แล้ว</p>
                <p className="text-2xl font-bold text-red-300 font-thai text-shadow">{accounts.filter(acc => acc.status === 'used').length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-4 md:p-6">
              <div className="text-center">
                <p className="text-sm font-medium text-white/70 font-thai-body">สินค้า</p>
                <p className="text-2xl font-bold text-blue-300 font-thai text-shadow">{uniqueProducts.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
                  <Input
                    placeholder="ค้นหาบัญชี..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 font-thai-body"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40 bg-white/10 border-white/20 text-white font-thai-body">
                    <SelectValue placeholder="สถานะ" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20">
                    <SelectItem value="all" className="font-thai-body">ทั้งหมด</SelectItem>
                    <SelectItem value="available" className="font-thai-body">พร้อมใช้</SelectItem>
                    <SelectItem value="used" className="font-thai-body">ใช้แล้ว</SelectItem>
                    <SelectItem value="maintenance" className="font-thai-body">ปรับปรุง</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={productFilter} onValueChange={setProductFilter}>
                  <SelectTrigger className="w-full sm:w-40 bg-white/10 border-white/20 text-white font-thai-body">
                    <SelectValue placeholder="สินค้า" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20">
                    <SelectItem value="all" className="font-thai-body">ทั้งหมด</SelectItem>
                    {uniqueProducts.map(product => (
                      <SelectItem key={product} value={product} className="font-thai-body">{product}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="bg-green-500/10 border-green-500/30 text-green-300 hover:bg-green-500/20 backdrop-blur-xl shadow-lg transition-all duration-300 hover:scale-105 font-thai"
                  onClick={() => setIsAddingAccount(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  เพิ่มบัญชี
                </Button>
                
                <Button
                  variant="outline"
                  className="bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20 backdrop-blur-xl shadow-lg transition-all duration-300 hover:scale-105 font-thai"
                  onClick={() => { setBulkOpen(true); setBulkError(null); setBulkSuccess(null); }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  นำเข้าหลายรายการ
                </Button>

                <Button
                  variant="outline"
                  className="bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20 backdrop-blur-xl shadow-lg transition-all duration-300 hover:scale-105 font-thai"
                  onClick={exportToCSV}
                >
                  <Download className="w-4 h-4 mr-2" />
                  ส่งออก CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Import Dialog */}
        {bulkOpen && (
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
            <CardHeader className="p-4 md:p-6 border-b border-white/10">
              <CardTitle className="text-xl text-white font-thai">นำเข้าข้อมูลหลายรายการ</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4">
              {bulkError && (
                <div className="rounded-md border border-red-500/40 bg-red-500/10 text-red-200 p-3 text-sm">{bulkError}</div>
              )}
              {bulkSuccess && (
                <div className="rounded-md border border-green-500/40 bg-green-500/10 text-green-200 p-3 text-sm">{bulkSuccess}</div>
              )}

              <div className="space-y-2">
                <Label className="text-white font-thai-body">โหมดการนำเข้า</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={bulkMode === 'normal' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setBulkMode('normal')}
                  >
                    โหมดเดิม (โค้ด:ชื่อผู้ใช้:รหัสผ่าน[:ชื่อสินค้า])
                  </Button>
                  <Button
                    type="button"
                    variant={bulkMode === 'codeType' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setBulkMode('codeType')}
                  >
                    โหมดใส่โค้ด,ประเภท (เช่น DSD2130,50-999M)
                  </Button>
                </div>

                {bulkMode === 'codeType' ? (
                  <div className="rounded-md border bg-blue-50/10 border-blue-400/30 p-3 text-sm text-blue-200">
                    <div className="font-semibold mb-1">วิธีใช้งานโหมดใส่โค้ด,ประเภท</div>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>รูปแบบ: โค้ด,ประเภท</li>
                      <li>ใส่หนึ่งรายการต่อหนึ่งบรรทัด</li>
                      <li>กด “นำเข้า” เพื่อบันทึก</li>
                    </ol>
                    <div className="mt-2">
                      ตัวอย่าง:
                      <pre className="mt-1 rounded bg-white/10 p-2 text-xs border border-white/20 text-white font-mono">
DSD2130,50-999M
ABC123,Free Fire
XYZ999,RoV
                      </pre>
                    </div>
                    <p className="mt-2 text-xs text-blue-200/80">
                      หมายเหตุ: ระบบจะตั้งชื่อผู้ใช้/รหัสผ่านเป็น “-” อัตโนมัติ และบันทึกประเภทไว้ที่ “ชื่อสินค้า”
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border bg-amber-50/10 border-amber-400/30 p-3 text-sm text-amber-200">
                    <div className="font-semibold mb-1">วิธีใช้งานโหมดเดิม (ละเอียด)</div>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>รูปแบบ: โค้ด:ชื่อผู้ใช้:รหัสผ่าน[:ชื่อสินค้า]</li>
                      <li>ใส่หนึ่งรายการต่อหนึ่งบรรทัด</li>
                      <li>กด “นำเข้า” เพื่อบันทึก</li>
                    </ol>
                    <div className="mt-2">
                      ตัวอย่าง:
                      <pre className="mt-1 rounded bg-white/10 p-2 text-xs border border-white/20 text-white font-mono">
CHICKEN01:BoneBlossom:user123:pass123:Premium Account
CHICKEN02:Butterfly:user456:pass456
CHICKEN03:RoyalWings:user789:pass789:VIP Account
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label className="text-white font-thai-body">ข้อมูลที่ต้องการนำเข้า (หนึ่งรายการต่อบรรทัด)</Label>
                <Textarea
                  rows={8}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 font-mono"
                  placeholder={bulkMode === 'codeType'
                    ? 'DSD2130,50-999M\nABC123,Free Fire\nXYZ999,RoV'
                    : 'CHICKEN01:BoneBlossom:user123:pass123:Premium Account\nCHICKEN02:Butterfly:user456:pass456\nCHICKEN03:RoyalWings:user789:pass789:VIP Account'}
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" className="bg-white/10 border-white/20 text-white" onClick={() => setBulkOpen(false)}>
                  ปิด
                </Button>
                <Button
                  onClick={async () => {
                    if (!bulkInput.trim()) {
                      setBulkError('กรุณาวางข้อมูลก่อน');
                      return;
                    }
                    setBulkError(null);
                    setBulkSuccess(null);
                    setIsBulkAdding(true);
                    try {
                      const lines = bulkInput.trim().split('\n').map(l => l.trim()).filter(Boolean);
                      const accountsToAdd: { code: string; username: string; password: string; product_name: string | null }[] = [];
                      const errors: string[] = [];
                      for (let i = 0; i < lines.length; i++) {
                        const line = lines[i];
                        if (bulkMode === 'codeType') {
                          let parts: string[] = [];
                          if (line.includes(',')) parts = line.split(',');
                          else if (line.includes('|')) parts = line.split('|');
                          else if (line.includes(':')) parts = line.split(':');
                          if (parts.length < 2) { errors.push(`แถวที่ ${i+1}: รูปแบบไม่ถูกต้อง`); continue; }
                          const code = parts[0].trim();
                          const product = parts[1]?.trim() || '';
                          if (!code || !product) { errors.push(`แถวที่ ${i+1}: ข้อมูลไม่ครบ`); continue; }
                          accountsToAdd.push({ code, username: '-', password: '-', product_name: product });
                        } else {
                          let parts: string[] = [];
                          if (line.includes(':')) parts = line.split(':');
                          else if (line.includes(',')) parts = line.split(',');
                          else if (line.includes('|')) parts = line.split('|');
                          if (parts.length < 3) { errors.push(`แถวที่ ${i+1}: รูปแบบไม่ถูกต้อง`); continue; }
                          const code = parts[0].trim();
                          const username = parts[1].trim();
                          const password = parts[2].trim();
                          const product = parts[3]?.trim() || '';
                          if (!code || !username || !password) { errors.push(`แถวที่ ${i+1}: ข้อมูลไม่ครบ`); continue; }
                          accountsToAdd.push({ code, username, password, product_name: product || null });
                        }
                      }
                      if (accountsToAdd.length === 0) {
                        setBulkError('ไม่พบข้อมูลที่ถูกต้อง');
                        setIsBulkAdding(false);
                        return;
                      }
                      const codes = accountsToAdd.map(a => a.code);
                      const { data: existingCodes, error: checkError } = await supabase
                        .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_chicken_accounts")
                        .select("code")
                        .in("code", codes);
                      if (checkError) throw checkError;
                      const existing = new Set((existingCodes || []).map(c => c.code));
                      const uniqueAccounts = accountsToAdd.filter(a => !existing.has(a.code));
                      const duplicateCount = accountsToAdd.length - uniqueAccounts.length;
                      if (uniqueAccounts.length > 0) {
                        const { error: insertError } = await supabase
                          .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_chicken_accounts")
                          .insert(uniqueAccounts.map(a => ({
                            code: a.code,
                            username: a.username,
                            password: a.password,
                            product_name: a.product_name,
                            status: 'available'
                          })));
                        if (insertError) throw insertError;
                      }
                      let msg = `นำเข้าสำเร็จ ${uniqueAccounts.length} รายการ`;
                      if (duplicateCount > 0) msg += `, ข้ามโค้ดซ้ำ ${duplicateCount} รายการ`;
                      if (errors.length > 0) msg += `, พบข้อผิดพลาด ${errors.length} รายการ`;
                      setBulkSuccess(msg);
                      setBulkInput('');
                      setBulkOpen(false);
                      fetchAccounts();
                    } catch (e) {
                      setBulkError(e instanceof Error ? e.message : 'ไม่สามารถนำเข้าได้');
                    } finally {
                      setIsBulkAdding(false);
                    }
                  }}
                  disabled={isBulkAdding}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isBulkAdding ? 'กำลังนำเข้า...' : 'นำเข้า'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Account Form */}
        {isAddingAccount && (
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
            <CardHeader className="p-4 md:p-6 border-b border-white/10">
              <CardTitle className="text-xl text-white font-thai flex items-center gap-3">
                <Plus className="w-5 h-5" />
                เพิ่มบัญชีใหม่
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="text-white font-thai-body">ชื่อผู้ใช้</Label>
                  <Input
                    value={newAccount.username}
                    onChange={(e) => setNewAccount(prev => ({ ...prev, username: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 font-thai-body"
                    placeholder="กรอกชื่อผู้ใช้..."
                  />
                </div>
                
                <div>
                  <Label className="text-white font-thai-body">รหัสผ่าน</Label>
                  <Input
                    type="password"
                    value={newAccount.password}
                    onChange={(e) => setNewAccount(prev => ({ ...prev, password: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 font-thai-body"
                    placeholder="กรอกรหัสผ่าน..."
                  />
                </div>
                
                <div>
                  <Label className="text-white font-thai-body">ชื่อสินค้า</Label>
                  <Input
                    value={newAccount.product_name}
                    onChange={(e) => setNewAccount(prev => ({ ...prev, product_name: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 font-thai-body"
                    placeholder="เช่น Robux, ไก่ตัน..."
                  />
                </div>
                
                <div>
                  <Label className="text-white font-thai-body">หมายเหตุ</Label>
                  <Input
                    value={newAccount.notes}
                    onChange={(e) => setNewAccount(prev => ({ ...prev, notes: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 font-thai-body"
                    placeholder="หมายเหตุเพิ่มเติม..."
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={addAccount}
                  className="bg-green-500 hover:bg-green-600 text-white font-thai"
                >
                  <Save className="w-4 h-4 mr-2" />
                  บันทึก
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddingAccount(false);
                    setNewAccount({ username: "", password: "", product_name: "", notes: "" });
                  }}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 font-thai"
                >
                  <X className="w-4 h-4 mr-2" />
                  ยกเลิก
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Accounts List */}
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
          <CardHeader className="p-4 md:p-6 border-b border-white/10">
            <CardTitle className="text-xl md:text-2xl text-white font-thai flex items-center gap-3 text-shadow">
              รายการบัญชี ({filteredAccounts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white/70 font-thai-body">กำลังโหลด...</p>
              </div>
            ) : filteredAccounts.length > 0 ? (
              <div className="space-y-4">
                {filteredAccounts.map((account) => (
                  <div key={account.id} className="p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md">
                    {editingId === account.id ? (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                        <Input
                          value={editingAccount.username || account.username}
                          onChange={(e) => setEditingAccount(prev => ({ ...prev, username: e.target.value }))}
                          className="bg-white/10 border-white/20 text-white font-thai-body"
                          placeholder="ชื่อผู้ใช้"
                        />
                        <Input
                          type="password"
                          value={editingAccount.password || account.password}
                          onChange={(e) => setEditingAccount(prev => ({ ...prev, password: e.target.value }))}
                          className="bg-white/10 border-white/20 text-white font-thai-body"
                          placeholder="รหัสผ่าน"
                        />
                        <Input
                          value={editingAccount.product_name || account.product_name}
                          onChange={(e) => setEditingAccount(prev => ({ ...prev, product_name: e.target.value }))}
                          className="bg-white/10 border-white/20 text-white font-thai-body"
                          placeholder="ชื่อสินค้า"
                        />
                        <Select
                          value={editingAccount.status || account.status}
                          onValueChange={(value) => setEditingAccount(prev => ({ ...prev, status: value as 'available' | 'used' | 'maintenance' }))}
                        >
                          <SelectTrigger className="bg-white/10 border-white/20 text-white font-thai-body">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-white/20">
                            <SelectItem value="available" className="font-thai-body">พร้อมใช้</SelectItem>
                            <SelectItem value="used" className="font-thai-body">ใช้แล้ว</SelectItem>
                            <SelectItem value="maintenance" className="font-thai-body">ปรับปรุง</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                        <div>
                          <p className="text-xs text-white/50 font-thai-body mb-1">ชื่อผู้ใช้:</p>
                          <p className="text-white font-mono text-sm break-all">{account.username}</p>
                        </div>
                        <div>
                          <p className="text-xs text-white/50 font-thai-body mb-1">รหัสผ่าน:</p>
                          <p className="text-white font-mono text-sm break-all">••••••••</p>
                        </div>
                        <div>
                          <p className="text-xs text-white/50 font-thai-body mb-1">สินค้า:</p>
                          <p className="text-white font-thai-body text-sm">{account.product_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-white/50 font-thai-body mb-1">สถานะ:</p>
                          {getStatusBadge(account.status)}
                        </div>
                      </div>
                    )}
                    
                    {account.notes && (
                      <div className="mb-3">
                        <p className="text-xs text-white/50 font-thai-body mb-1">หมายเหตุ:</p>
                        <p className="text-white/70 text-sm font-thai-body">{account.notes}</p>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <p className="text-white/50 text-xs">
                        สร้างเมื่อ: {new Date(account.created_at).toLocaleString("th-TH")}
                      </p>
                      
                      <div className="flex gap-2">
                        {editingId === account.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => updateAccount(account.id)}
                              className="bg-green-500 hover:bg-green-600 text-white"
                            >
                              <Save className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingId(null);
                                setEditingAccount({});
                              }}
                              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingId(account.id);
                                setEditingAccount(account);
                              }}
                              className="bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteAccount(account.id)}
                              className="bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-white/70 font-thai-body">
                <div className="text-6xl mb-4">🐔</div>
                <p className="text-xl mb-2">ยังไม่มีบัญชีไก่ตันในระบบ</p>
                <p className="text-sm text-white/50">คลิกเพิ่มบัญชีเพื่อเริ่มต้นใช้งาน</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}